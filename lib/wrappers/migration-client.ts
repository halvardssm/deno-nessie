import { green } from "@std/fmt/colors";
import type { Connection } from "@stdx/database/sql";
import type {
  AmountMigrate,
  AmountRollback,
  AppliedMigration,
  FileEntry,
  LoggerFn,
  Migration,
  MigrationContext,
  NessieClient,
  Seed,
} from "../types.ts";
import { NessieError } from "../utils/errors.ts";
import {
  getDurationFromTimestamp,
  isRemoteUrl,
  isUrl,
} from "../utils/utils.ts";

/** Options for the {@linkcode MigrationClient} */
export interface MigrationClientOptions {
  /**
   * The migration files. They run in the order of their names, so the names
   * start with a timestamp. Each `path` is loaded with `import()`, and read for
   * its checksum. Defaults to none.
   *
   * Use {@linkcode listMigrationFiles} to scan a local folder, which is the
   * same scanning the CLI does. Remote folders can not be scanned: give
   * remote files explicit entries.
   */
  migrationFiles?: FileEntry[];
  /**
   * The seed files, loaded with `import()`. Defaults to none. Scan a local
   * folder with {@linkcode listMigrationFiles} and its `accept` option, e.g.
   * `accept: (name) => name.endsWith(".ts")`.
   */
  seedFiles?: FileEntry[];
  /** Receives debug output. Defaults to printing nothing. */
  logger?: LoggerFn;
  /**
   * Receives progress output, such as which migration is running. Defaults to
   * `console.info`. Pass `() => {}` to silence it.
   */
  info?: (message: string) => void;
  /**
   * Receives warnings, such as a migration which was edited after it was
   * applied. Defaults to `console.warn`.
   */
  warn?: (message: string) => void;
}

/**
 * The checksum of a migration file: the SHA-256 of its content, as hex.
 * Line endings are normalized first, so checking a file out with other line
 * endings does not change the checksum.
 *
 * @param file the file to read, from its `path`
 * @returns the 64 character hex checksum
 * @throws {NessieError} when a remote file can not be fetched
 *
 * @example
 * ```ts
 * import { getChecksum } from "@halvardm/nessie";
 * import { assertEquals } from "@std/assert";
 *
 * const path = await Deno.makeTempFile();
 * await Deno.writeTextFile(path, "a\nb\n");
 * const file = { name: "a.ts", path: `file://${path}` };
 *
 * assertEquals((await getChecksum(file)).length, 64);
 * // Windows line endings give the same checksum
 * await Deno.writeTextFile(path, "a\r\nb\r\n");
 * assertEquals(await getChecksum(file), await getChecksum(file));
 * await Deno.remove(path);
 * ```
 */
export async function getChecksum(file: FileEntry): Promise<string> {
  let content: string;
  if (isRemoteUrl(file.path)) {
    const response = await fetch(file.path);
    if (!response.ok) {
      throw new NessieError(
        `Could not fetch ${file.path} for its checksum: ${response.status}`,
      );
    }
    content = await response.text();
  } else {
    content = await Deno.readTextFile(
      isUrl(file.path) ? new URL(file.path) : file.path,
    );
  }
  const bytes = new TextEncoder().encode(content.replaceAll("\r\n", "\n"));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(
    new Uint8Array(digest),
    (b) => b.toString(16).padStart(2, "0"),
  )
    .join("");
}

/**
 * Runs migrations and seeds, and keeps track of which migrations are applied.
 *
 * This is what the CLI uses, and it can be used directly, for example to
 * migrate when an application starts, or in tests. It has no SQL of its own:
 * the table of applied migrations is kept through the
 * {@linkcode NessieClient}, so it works with every client which implements it.
 *
 * Each migration runs in a transaction, together with its record in the
 * migration table, unless it has `transaction: false`. A migration which
 * fails is rolled back, and is not recorded as applied. Migrations which were
 * edited after they were applied cause a warning.
 *
 * @example
 * ```ts
 * import { MigrationClient } from "@halvardm/nessie";
 * import { SqliteClient } from "@halvardm/nessie/clients/sqlite";
 * import { assertEquals } from "@std/assert";
 *
 * const dir = await Deno.makeTempDir();
 * const name = "20240101120000_create_users.ts";
 * await Deno.writeTextFile(
 *   `${dir}/${name}`,
 *   `export default {
 *     async up({ client }) {
 *       await client.execute("CREATE TABLE users (id INTEGER)");
 *     },
 *     async down({ client }) {
 *       await client.execute("DROP TABLE users");
 *     },
 *   };`,
 * );
 *
 * await using client = new SqliteClient(":memory:");
 * const migrations = new MigrationClient(client, {
 *   migrationFiles: [{ name, path: `file://${dir}/${name}` }],
 *   info: () => {}, // no progress output
 * });
 *
 * assertEquals(await migrations.migrate(), [name]);
 * assertEquals(await migrations.getApplied(), [name]);
 * assertEquals(await migrations.getModified(), []);
 * assertEquals(await migrations.rollback(), [name]);
 *
 * await Deno.remove(dir, { recursive: true });
 * ```
 */
export class MigrationClient {
  /** The client which migrations and seeds run on */
  readonly client: NessieClient;
  /** The migration files, sorted by name, which is the order they run in */
  readonly migrationFiles: FileEntry[];
  /** The seed files */
  readonly seedFiles: FileEntry[];
  #logger: LoggerFn;
  #info: (message: string) => void;
  #warn: (message: string) => void;

  /**
   * Creates the migration client. Nothing is run, and the client is not
   * connected, until a method is called.
   *
   * @param client the client to run on, which keeps the migration table.
   * It is not closed by this class.
   * @param options the files to run, and where output goes
   */
  constructor(client: NessieClient, options: MigrationClientOptions = {}) {
    this.client = client;
    this.migrationFiles = [...(options.migrationFiles ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    this.seedFiles = options.seedFiles ?? [];
    this.#logger = options.logger ?? (() => undefined);
    this.#info = options.info ?? ((message) => console.info(message));
    this.#warn = options.warn ?? ((message) => console.warn(message));
  }

  /**
   * Creates the migration table if it does not exist, and updates a table
   * made by an earlier version. `migrate` and `rollback` do this themselves,
   * call it to read the applied migrations before either has run.
   */
  async prepare(): Promise<void> {
    await using connection = await this.client.acquire();
    await this.client.createMigrationTable(connection);
  }

  /**
   * The names of the applied migrations.
   *
   * @returns the file names, newest first
   */
  async getApplied(): Promise<string[]> {
    await using connection = await this.client.acquire();
    return await this.#getApplied(connection);
  }

  /**
   * The applied migrations, with the checksums they were applied with.
   *
   * @returns the applied migrations, newest first
   */
  async getAppliedMigrations(): Promise<AppliedMigration[]> {
    await using connection = await this.client.acquire();
    return await this.#getAppliedMigrations(connection);
  }

  /**
   * The applied migrations whose file has been edited since they were applied,
   * found by comparing checksums. Migrations applied before checksums were
   * stored are not included, as there is nothing to compare to, and neither are
   * applied migrations whose file is not in {@linkcode MigrationClient.migrationFiles}.
   *
   * @returns the file names of the modified migrations
   */
  async getModified(): Promise<string[]> {
    await using connection = await this.client.acquire();
    return await this.#getModified(
      await this.#getAppliedMigrations(connection),
    );
  }

  /**
   * Runs `up` on the pending migrations, oldest first, each in its own
   * transaction. Pending migrations are the files which are not applied yet.
   *
   * Warns about applied migrations which were edited, which does not stop the
   * migration. Migrations applied before checksums existed are given a
   * checksum.
   *
   * @param amount how many migrations to run, all pending when omitted
   * @returns the names of the migrations that were applied
   * @throws {NessieError} when `amount` is not a whole number, or is negative, or a
   * migration file does not default export an object with `up` and `down`
   * @throws when a migration fails. The migrations before it stay applied.
   */
  async migrate(amount?: AmountMigrate): Promise<string[]> {
    await this.prepare();
    await using connection = await this.client.acquire();

    const appliedMigrations = await this.#getAppliedMigrations(connection);
    for (const name of await this.#getModified(appliedMigrations)) {
      this.#warn(
        `Warning: migration ${name} has been modified since it was applied`,
      );
    }
    await this.#backfillChecksums(connection, appliedMigrations);

    const applied = new Set(appliedMigrations.map((m) => m.name));
    const pending = this.migrationFiles.filter((f) => !applied.has(f.name));
    const count = parseAmount(amount, pending.length, true);
    this.#logger(pending, "Pending migration files");

    if (count < 1) {
      this.#info("Nothing to migrate");
      return [];
    }

    this.#info(green(`Starting migration of ${count} files\n----\n`));
    const t1 = performance.now();
    const done: string[] = [];

    for (const file of pending.slice(0, count)) {
      this.#info(green(`Migrating ${file.name}`));
      const t2 = performance.now();
      await this.#run(connection, file, "up");
      done.push(file.name);
      this.#info(`Done in ${getDurationFromTimestamp(t2)} seconds\n----\n`);
    }

    this.#info(
      green(`Migrations completed in ${getDurationFromTimestamp(t1)} seconds`),
    );
    return done;
  }

  /**
   * Runs `down` on the applied migrations, newest first, each in its own
   * transaction, and removes their record.
   *
   * @param amount how many migrations to roll back, one when omitted, or
   * `"all"`
   * @returns the names of the migrations that were rolled back
   * @throws {NessieError} when `amount` is not a whole number, or is negative, or
   * `"all"`, or when the file of an applied migration can not be found
   * @throws when a migration fails. The migrations before it stay rolled back.
   */
  async rollback(amount?: AmountRollback): Promise<string[]> {
    await this.prepare();
    await using connection = await this.client.acquire();

    const applied = await this.#getApplied(connection);
    const count = parseAmount(amount, applied.length, false);
    this.#logger(applied, "Applied migrations");

    if (count < 1) {
      this.#info("Nothing to rollback");
      return [];
    }

    this.#info(green(`Starting rollback of ${count} files\n----\n`));
    const t1 = performance.now();
    const done: string[] = [];

    for (const name of applied.slice(0, count)) {
      const file = this.migrationFiles.find((f) => f.name === name);
      if (!file) throw new NessieError(`Migration file '${name}' is not found`);
      this.#info(`Rolling back ${file.name}`);
      const t2 = performance.now();
      await this.#run(connection, file, "down");
      done.push(file.name);
      this.#info(`Done in ${getDurationFromTimestamp(t2)} seconds\n----\n`);
    }

    this.#info(
      green(`Rollback completed in ${getDurationFromTimestamp(t1)} seconds`),
    );
    return done;
  }

  /**
   * Runs the `run` of the seed files whose name matches, in the order of their
   * names. Seeds are not recorded, so they run every time.
   *
   * @param matcher a seed file name, or a RegExp which matches file names.
   * Defaults to every `.ts` file.
   * @returns the names of the seeds that were run
   * @throws {NessieError} when a seed file does not default export an object
   * with `run`
   */
  async seed(matcher = ".+.ts"): Promise<string[]> {
    const regexp = new RegExp(matcher);
    const files = this.seedFiles.filter((f) =>
      f.name === matcher || regexp.test(f.name)
    );

    if (files.length < 1) {
      this.#info(`No seed file found with matcher '${matcher}'`);
      return [];
    }

    this.#info(green(`Starting seeding of ${files.length} files\n----\n`));
    const t1 = performance.now();
    await using connection = await this.client.acquire();
    const done: string[] = [];

    for (const file of files) {
      this.#info(`Seeding ${file.name}`);
      const t2 = performance.now();
      const seed = await importDefault<Seed>(file, ["run"]);
      await seed.run(this.#context(connection));
      done.push(file.name);
      this.#info(`Done in ${getDurationFromTimestamp(t2)} seconds\n----\n`);
    }

    this.#info(
      green(`Seeding completed in ${getDurationFromTimestamp(t1)} seconds`),
    );
    return done;
  }

  #context(client: MigrationContext["client"]): MigrationContext {
    return { client, dialect: this.client.dialect };
  }

  #getAppliedMigrations(connection: Connection): Promise<AppliedMigration[]> {
    return this.client.getAppliedMigrations(connection);
  }

  async #getModified(applied: AppliedMigration[]): Promise<string[]> {
    const modified: string[] = [];
    for (const { name, checksum } of applied) {
      const file = this.migrationFiles.find((f) => f.name === name);
      // Files which are gone are reported by rollback, when they are needed
      if (!file || checksum === null) continue;
      if (await getChecksum(file) !== checksum) modified.push(name);
    }
    return modified;
  }

  /** Migrations applied before checksums existed get the current checksum */
  async #backfillChecksums(
    connection: Connection,
    applied: AppliedMigration[],
  ): Promise<void> {
    for (const { name, checksum } of applied) {
      const file = this.migrationFiles.find((f) => f.name === name);
      if (checksum !== null || !file) continue;
      await this.client.setChecksum(connection, name, await getChecksum(file));
    }
  }

  async #getApplied(connection: Connection): Promise<string[]> {
    const applied = await this.#getAppliedMigrations(connection);
    return applied.map((m) => m.name);
  }

  async #run(
    connection: Connection,
    file: FileEntry,
    direction: "up" | "down",
  ) {
    const migration = await importDefault<Migration>(file, ["up", "down"]);
    const checksum = direction === "up" ? await getChecksum(file) : undefined;

    // The migration is recorded on the same connection, and in the same
    // transaction, that ran it
    const run = async (client: MigrationContext["client"]) => {
      await migration[direction](this.#context(client));
      if (checksum === undefined) {
        await this.client.removeMigration(client, file.name);
      } else {
        await this.client.addMigration(client, file.name, checksum);
      }
    };

    if (migration.transaction === false) {
      await run(connection);
    } else {
      await connection.transaction(run);
    }
  }
}

function parseAmount(
  amount: AmountRollback,
  max: number,
  isMigration: boolean,
): number {
  if (amount === "all") return max;
  if (amount === undefined) return isMigration ? max : Math.min(max, 1);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new NessieError(`Invalid amount '${amount}'`);
  }
  return Math.min(max, amount);
}

async function importDefault<T>(
  file: FileEntry,
  methods: (keyof T & string)[],
): Promise<T> {
  const module = await import(file.path);
  const value = module.default as T | undefined;
  for (const method of methods) {
    if (typeof value?.[method] !== "function") {
      throw new NessieError(
        `'${file.name}' must have a default export with a '${method}' method`,
      );
    }
  }
  return value as T;
}
