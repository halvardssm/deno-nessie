import type { AbstractClient } from "./clients/AbstractClient.ts";
import { DB_DIALECTS } from "./consts.ts";
/** Supported dialects */
export type DBDialects = DB_DIALECTS | string;

/** Exposed object in migration files. available in `up`/`down` methods.
 * queryBuilder is available when passing `exposeQueryBuilder: true` to the config file.
 */
export type Info<T = undefined> = {
  dialect: DBDialects;
};

/** Logger function. */
// deno-lint-ignore no-explicit-any
export type LoggerFn = (output?: any, title?: string) => void;
/** Handy type to cover printf. */
export type QueryWithString = (string: string) => string;
/** Amount type for migrations. */
export type AmountMigrateT = number | undefined;
/** Amount type for rollbacks. */
export type AmountRollbackT = AmountMigrateT | "all";
/** Query type. */
export type QueryT = string | string[];
/** Query handler function. */
// deno-lint-ignore no-explicit-any
export type QueryHandler = (query: QueryT) => Promise<any>;

/** Nessie config options. */
export interface NessieConfig {
  /** Can be any class which extends `AbstractClient`. */
  // deno-lint-ignore no-explicit-any
  client: AbstractClient<any>;
  /**
   * The folders where migration files are located.
   * Can be a relative path or an absolute path.
   * Defaults to ['./db/migrations/'] if additionalMigrationFiles is not populated
   */
  migrationFolders?: string[];
  /**
  * The folders where seed files are located.
  * Can be a relative path or an absolute path.
  * Defaults to ['./db/seeds/'] if additionalSeedFiles is not populated
  */
  seedFolders?: string[];
  /**
  * Additional migration files which will be added to the
  * list to parse when running the migrate or rollback command.
  * Can be any format supported by `import()` e.g. url or path
  */
  additionalMigrationFiles?: string[];
  /**
  * Additional seed files which will be added to the list to
  * match against when running the seed command.
  * Can be any format supported by `import()` e.g. url or path
  */
  additionalSeedFiles?: string[];
  /** Enables verbose output for debugging */
  debug?: boolean;
}

export interface AbstractClientOptions<Client> {
  client: Client;
}

export type FileEntryT = {
  name: string;
  path: string;
};

export type CommandOptions = {
  debug: boolean;
  config: string;
};

export interface CommandOptionsInit extends CommandOptions {
  mode?: "config" | "folders";
  dialect?: DB_DIALECTS;
}

export interface StateOptions {
  debug: boolean;
  config: NessieConfig;
  migrationFolders: string[];
  seedFolders: string[];
  migrationFiles: FileEntryT[];
  seedFiles: FileEntryT[];
}
