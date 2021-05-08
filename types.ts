import type { AbstractClient } from "./clients/AbstractClient.ts";
/** Supported dialects */
export type DBDialects = "pg" | "mysql" | "sqlite3" | string;

/** Exposed object in migration files. available in `up`/`down` methods.
 * queryBuilder is available when passing `exposeQueryBuilder: true` to the config file.
 */
export type Info<T = undefined> = {
  dialect: DBDialects;
  /** @deprecated Will be removed as the client will be exposed in the wrapper class */
  connection: QueryHandler;
};

/**
 * @deprecated Please consider using the class migrations.
 *
 * `up`/`down` methods in migration files.
 */
export type Migration<T = undefined> = (
  info: Info<T>,
) => string | string[] | Promise<string | string[]>;
/**
 * @deprecated Please consider using the class seeds.
 *  
 * `run` method in seed files. 
 */
export type Seed = () => string | string[] | Promise<string | string[]>;
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

/**
 * @deprecated Consider using migration classes.
 *
 * Type for migration files.
 */
export type MigrationFile = {
  up: Migration;
  down: Migration;
};

/** Nessie config options. */
export interface NessieConfig {
  // deno-lint-ignore no-explicit-any
  client: AbstractClient<any>;
  /** 
   * Enables experimental options like migration classes, 
   * features enabled in experimental mode are soon to be default 
   * either in the next minor or major release 
   */
  experimental?: boolean;
  /** 
   * Defaults to false, only set to true if you are starting a new 
   * project, or have run the upgrade_timestamps command (see readme)
   */
  useDateTime?: boolean;
}

/** Client config options. */
export interface ClientOptions {
  /** @deprecated use `migrationFolders` instead */
  migrationFolder?: string;
  migrationFolders?: string[];
  /** @deprecated use `seedFolders` instead */
  seedFolder?: string;
  seedFolders?: string[];
  // deno-lint-ignore no-explicit-any
  [option: string]: any;
}
export interface AbstractClientOptions<Client> extends ClientOptions {
  client: Client;
}

export type FileEntryT = {
  name: string;
  path: string;
};

export type CommandOptions = {
  debug: boolean;
  config?: string;
};
