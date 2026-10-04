import type {
  Client,
  Dialect,
  Preparable,
  Queryable,
  Transactionable,
} from "@stdext/database/sql";

/**
 * A function for debug output, enabled with `--debug` or `debug: true`.
 *
 * @param output the value to print
 * @param title a title printed before the value
 */
export type LoggerFn = (output?: unknown, title?: string) => void;

/**
 * The number of migrations to run. `undefined` runs all pending migrations.
 */
export type AmountMigrate = number | undefined;

/**
 * The number of migrations to roll back. `undefined` rolls back one, and
 * `"all"` rolls back every applied migration.
 */
export type AmountRollback = AmountMigrate | "all";

/**
 * A migration or seed file, wherever it is located.
 *
 * @example
 * ```ts
 * import type { FileEntry } from "@halvardm/nessie";
 *
 * const file: FileEntry = {
 *   name: "20240101120000_create_users.ts",
 *   path: "file:///project/db/migrations/20240101120000_create_users.ts",
 * };
 * ```
 */
export interface FileEntry {
  /**
   * The file name, which is what the migration is recorded as. Migration
   * names are sorted to decide the order they run in, so they start with a
   * timestamp, e.g. `20240101120000_create_users.ts`.
   */
  name: string;
  /**
   * Where to load the file from: a `file:`, `http:` or `https:` URL, anything
   * `import()` accepts. The same location is read to calculate the checksum.
   */
  path: string;
}

/**
 * What a migration or seed is run with.
 *
 * @example
 * ```ts ignore
 * import type { Migration } from "@halvardm/nessie";
 *
 * export default {
 *   async up({ client, dialect }) {
 *     // `dialect` is for SQL which differs between databases
 *     const id = dialect.name === "postgres" ? "bigserial" : "integer";
 *     await client.execute(`CREATE TABLE posts (id ${id} PRIMARY KEY)`);
 *   },
 *   async down({ client }) {
 *     await client.execute("DROP TABLE posts");
 *   },
 * } satisfies Migration;
 * ```
 */
export interface MigrationContext {
  /**
   * Runs the statements of the migration or seed. For a migration, this is the
   * transaction it runs in, which is committed together with its entry in the
   * migration table, or the connection when the migration has
   * `transaction: false`. A seed gets the connection, so a seed which needs a
   * transaction uses `client.transaction()`.
   */
  readonly client: Queryable & Preparable & Transactionable;
  /**
   * The SQL dialect of the database: its `name` (`"sqlite"`, `"postgres"` or
   * `"mysql"`), the `placeholder(index)` of a parameter, and how to
   * `quoteIdentifier(name)`.
   */
  readonly dialect: Dialect;
}

/**
 * A migration, which is the default export of a migration file.
 *
 * The file is named `<yyyyMMddHHmmss>_<name>.ts`, e.g.
 * `20240101120000_create_users.ts`, and migrations run in the order of their
 * names. Once a migration has been applied, its file should not be changed:
 * nessie warns on `migrate` and `status` if it is, as the database no longer
 * matches the file.
 *
 * @example
 * ```ts ignore
 * import type { Migration } from "@halvardm/nessie";
 *
 * export default {
 *   async up({ client }) {
 *     await client.execute(
 *       "CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL)",
 *     );
 *   },
 *   async down({ client }) {
 *     await client.execute("DROP TABLE users");
 *   },
 * } satisfies Migration;
 * ```
 */
export interface Migration {
  /**
   * Whether `up` and `down` run in a transaction. Defaults to `true`, so a
   * failing migration is rolled back, and not recorded as applied.
   *
   * Set it to `false` for statements which can not run in a transaction, such
   * as `CREATE INDEX CONCURRENTLY` on Postgres. MySQL commits DDL statements
   * implicitly, so changes to the schema are never rolled back there, with or
   * without a transaction.
   */
  transaction?: boolean;
  /** Applies the migration, on `nessie migrate` */
  up(context: MigrationContext): Promise<void> | void;
  /** Reverts the migration, on `nessie rollback` */
  down(context: MigrationContext): Promise<void> | void;
}

/**
 * A seed, which is the default export of a file in a seed folder. Unlike
 * migrations, seeds are not recorded: they run every time they are asked for,
 * so they should be safe to run repeatedly.
 *
 * @example
 * ```ts ignore
 * import type { Seed } from "@halvardm/nessie";
 *
 * export default {
 *   async run({ client }) {
 *     await client.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");
 *   },
 * } satisfies Seed;
 * ```
 */
export interface Seed {
  /** Seeds the database, on `nessie seed` */
  run(context: MigrationContext): Promise<void> | void;
}

/**
 * An applied migration, as stored in the migration table.
 *
 * @example
 * ```ts
 * import type { AppliedMigration } from "@halvardm/nessie";
 *
 * const applied: AppliedMigration = {
 *   name: "20240101120000_create_users.ts",
 *   checksum: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
 * };
 * ```
 */
export interface AppliedMigration {
  /** The file name of the migration */
  name: string;
  /**
   * The SHA-256 of the file as hex, from when it was applied. `null` for
   * migrations applied before checksums were stored, which have nothing to be
   * compared to.
   */
  checksum: string | null;
}

/**
 * The client nessie runs on: an `@stdext/database` {@linkcode Client} which
 * also keeps the table of applied migrations.
 *
 * Nessie itself has no SQL. How the table is created, and what it looks like,
 * differs between databases, so the client does that, and nessie only calls
 * these five methods. `SqliteClient`, `PostgresClient` and `MysqlClient` from
 * `@halvardm/nessie/clients/*` implement this interface, and so can your own
 * client, to support another database or to store the migrations elsewhere. A
 * plain `@stdext/database` client does not implement it, and is rejected.
 *
 * Each method gets the `Queryable` to use as `db`. Always use it instead of
 * the client itself: nessie passes the connection, or the transaction, that is
 * running a migration, so the migration and its record are committed together.
 *
 * @example
 * ```ts
 * import { SqliteClient } from "@halvardm/nessie/clients/sqlite";
 *
 * await using client = new SqliteClient(":memory:");
 * await using connection = await client.acquire();
 *
 * await client.createMigrationTable(connection);
 * await client.addMigration(connection, "20240101120000_create_users.ts", "abc");
 * console.log(await client.getAppliedMigrations(connection));
 * // [{ name: "20240101120000_create_users.ts", checksum: "abc" }]
 * ```
 */
export interface NessieClient extends Client {
  /**
   * Creates the migration table if it does not exist, and brings a table made
   * by an earlier version up to date, e.g. by adding a column. Nessie calls it
   * before it migrates, rolls back, seeds or reports the status, so it must be
   * safe to call repeatedly.
   *
   * @param db the connection to run on
   */
  createMigrationTable(db: Queryable): Promise<void>;
  /**
   * The applied migrations, ordered by name, newest first.
   *
   * @param db the connection to run on
   * @returns the migrations, with the checksums they were applied with
   */
  getAppliedMigrations(db: Queryable): Promise<AppliedMigration[]>;
  /**
   * Records that a migration is applied. Nessie calls it after `up`, in the
   * transaction of the migration.
   *
   * @param db the connection or transaction the migration ran on
   * @param name the file name of the migration
   * @param checksum the SHA-256 of the file, as hex
   */
  addMigration(db: Queryable, name: string, checksum: string): Promise<void>;
  /**
   * Removes the record of an applied migration. Nessie calls it after `down`,
   * in the transaction of the migration.
   *
   * @param db the connection or transaction the migration ran on
   * @param name the file name of the migration
   */
  removeMigration(db: Queryable, name: string): Promise<void>;
  /**
   * Sets the checksum of an applied migration, to give migrations applied
   * before checksums existed one.
   *
   * @param db the connection to run on
   * @param name the file name of the migration
   * @param checksum the SHA-256 of the file, as hex
   */
  setChecksum(db: Queryable, name: string, checksum: string): Promise<void>;
}

/**
 * The options of nessie, which is the default export of the config file
 * (`nessie.config.ts`).
 *
 * @example
 * ```ts ignore
 * import type { NessieConfig } from "@halvardm/nessie";
 * import { PostgresClient } from "@halvardm/nessie/clients/postgres";
 *
 * const config: NessieConfig = {
 *   client: new PostgresClient("postgres://root:pwd@localhost:5432/nessie"),
 *   migrationFolders: ["./db/migrations"],
 *   seedFolders: ["./db/seeds"],
 * };
 *
 * export default config;
 * ```
 */
export interface NessieConfig {
  /**
   * The client to run on: `SqliteClient`, `PostgresClient`, `MysqlClient`, or
   * any other {@linkcode NessieClient}. It is closed when a command is done.
   */
  client: NessieClient;
  /**
   * The folders with migration files, relative to the working directory or
   * absolute. Defaults to `./db/migrations`, unless
   * {@linkcode NessieConfig.additionalMigrationFiles} is set.
   */
  migrationFolders?: string[];
  /**
   * The folders with seed files, relative to the working directory or
   * absolute. Defaults to `./db/seeds`, unless
   * {@linkcode NessieConfig.additionalSeedFiles} is set.
   */
  seedFolders?: string[];
  /**
   * Migration files to run in addition to those in the folders, e.g. shared
   * between projects. Anything `import()` accepts, such as a URL. The file
   * name must be a valid migration name.
   */
  additionalMigrationFiles?: string[];
  /**
   * Seed files to run in addition to those in the folders. Anything `import()`
   * accepts, such as a URL.
   */
  additionalSeedFiles?: string[];
  /**
   * A path or URL to the template `make:migration` writes, instead of the
   * default. The `--migration-template` flag takes precedence.
   */
  migrationTemplate?: string;
  /**
   * A path or URL to the template `make:seed` writes, instead of the default.
   * The `--seed-template` flag takes precedence.
   */
  seedTemplate?: string;
  /** Verbose output, the same as the `--debug` flag. Defaults to `false`. */
  debug?: boolean;
}
