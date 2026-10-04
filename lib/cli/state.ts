import { basename, fromFileUrl, resolve, toFileUrl } from "@std/path";
import { DEFAULT_MIGRATION_FOLDER, DEFAULT_SEED_FOLDER } from "../consts.ts";
import type { FileEntry, LoggerFn, NessieConfig } from "../types.ts";
import { NessieError } from "../utils/errors.ts";
import {
  arrayIsUnique,
  getLogger,
  isFileUrl,
  isMigrationFile,
  isUrl,
} from "../utils/utils.ts";
import { MigrationClient } from "../wrappers/migration-client.ts";

/** The methods nessie needs on top of an `@stdext/database` client */
const NESSIE_CLIENT_METHODS = [
  "createMigrationTable",
  "getAppliedMigrations",
  "addMigration",
  "removeMigration",
  "setChecksum",
] as const;

/** Options to load the {@linkcode State} with */
export interface LoadStateOptions {
  /**
   * Path or URL of the config file. A path is relative to the working
   * directory.
   */
  config: string;
  /** Verbose output, in addition to `debug` in the config file */
  debug?: boolean;
  /** Receives progress output. Defaults to `console.info`. */
  info?: (message: string) => void;
  /** Receives warnings. Defaults to `console.warn`. */
  warn?: (message: string) => void;
}

/** What a command needs: the loaded config, the files found, and the client */
export interface State {
  /** The default export of the config file */
  config: NessieConfig;
  /** The migration folders, as absolute paths */
  migrationFolders: string[];
  /** The seed folders, as absolute paths */
  seedFolders: string[];
  /** The migration files in the folders and `additionalMigrationFiles`, sorted */
  migrationFiles: FileEntry[];
  /** The seed files in the folders and `additionalSeedFiles`, sorted */
  seedFiles: FileEntry[];
  /** Runs migrations and seeds with the files and the client of the config */
  migrations: MigrationClient;
  /** Prints debug output, if it is enabled */
  logger: LoggerFn;
}

/**
 * Loads the config file, and finds the migration and seed files. The client in
 * the config is not closed, that is up to the caller.
 *
 * @param options the config file, and where output goes
 * @returns the state to run a command with
 * @throws {NessieError} when the config file can not be found, does not default
 * export a client implementing {@linkcode NessieClient}, has folders which are
 * missing or listed twice, or the files have duplicate names
 */
export async function loadState(options: LoadStateOptions): Promise<State> {
  const configUrl = isUrl(options.config)
    ? options.config
    : toFileUrl(resolve(Deno.cwd(), options.config)).href;

  if (isFileUrl(configUrl)) {
    try {
      await Deno.stat(fromFileUrl(configUrl));
    } catch {
      throw new NessieError(`Config file is not found at ${configUrl}`);
    }
  }

  const config = (await import(configUrl)).default as NessieConfig | undefined;
  if (typeof config?.client?.acquire !== "function") {
    throw new NessieError(
      "The config file must default export an object with a valid client",
    );
  }
  const missing = NESSIE_CLIENT_METHODS.filter((method) =>
    typeof config.client[method] !== "function"
  );
  if (missing.length > 0) {
    throw new NessieError(
      `The client does not implement the nessie client interface (missing ${
        missing.join(", ")
      }). Use a client from '@halvardm/nessie/clients/*', e.g. SqliteClient, or implement NessieClient.`,
    );
  }

  const logger = getLogger(options.debug || config.debug);
  const { migrationFolders, seedFolders } = parseFolders(config);
  const migrationFiles = await findFiles(
    migrationFolders,
    config.additionalMigrationFiles,
    isMigrationFile,
    "migration",
  );
  const seedFiles = await findFiles(
    seedFolders,
    config.additionalSeedFiles,
    (name) => name.endsWith(".ts"),
    "seed",
  );

  logger({ migrationFolders, seedFolders, migrationFiles, seedFiles }, "State");

  return {
    config,
    migrationFolders,
    seedFolders,
    migrationFiles,
    seedFiles,
    logger,
    migrations: new MigrationClient(config.client, {
      migrationFiles,
      seedFiles,
      logger,
      info: options.info,
      warn: options.warn,
    }),
  };
}

function parseFolders(config: NessieConfig) {
  const resolveAll = (
    folders: string[] | undefined,
    fallback: string,
    hasAdditional: boolean,
  ) => {
    if (folders && !arrayIsUnique(folders)) {
      throw new NessieError("Entries for the folders have to be unique");
    }
    const resolved = (folders ?? []).map((f) => resolve(Deno.cwd(), f));
    if (resolved.length < 1 && !hasAdditional) {
      resolved.push(resolve(Deno.cwd(), fallback));
    }
    if (!arrayIsUnique(resolved)) {
      throw new NessieError(
        "Entries for the resolved folders have to be unique",
      );
    }
    return resolved;
  };

  return {
    migrationFolders: resolveAll(
      config.migrationFolders,
      DEFAULT_MIGRATION_FOLDER,
      config.additionalMigrationFiles !== undefined,
    ),
    seedFolders: resolveAll(
      config.seedFolders,
      DEFAULT_SEED_FOLDER,
      config.additionalSeedFiles !== undefined,
    ),
  };
}

async function findFiles(
  folders: string[],
  additional: string[] | undefined,
  accept: (name: string) => boolean,
  kind: string,
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];

  for (const folder of folders) {
    try {
      for await (const entry of Deno.readDir(folder)) {
        if (entry.isFile && accept(entry.name)) {
          files.push({
            name: entry.name,
            path: toFileUrl(resolve(folder, entry.name)).href,
          });
        }
      }
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        throw new NessieError(
          `The ${kind} folder ${folder} does not exist, run 'nessie init' to create it`,
        );
      }
      throw e;
    }
  }

  for (const file of additional ?? []) {
    const path = isUrl(file) ? file : toFileUrl(resolve(Deno.cwd(), file)).href;
    const name = basename(path);
    if (accept(name)) files.push({ name, path });
  }

  if (!arrayIsUnique(files.map((f) => f.name))) {
    throw new NessieError(`Entries for the ${kind} files have to be unique`);
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}
