/** Supported dialects */
export type DBDialects = "pg" | "mysql" | "sqlite3";

/** Exposed object in migration files. available in `up`/`down` methods.
 * queryBuilder is available when passing `exposeQueryBuilder: true` to the config file.
 */
export type Info<T = any> = {
  dialect: DBDialects;
  queryBuilder?: T;
};

/** `up`/`down` methods in migration files. */
export type Migration<T = any> = (
  info: Info<T>,
) => string | string[] | Promise<string | string[]>;
/** `run` method in seed files. */
export type Seed = () => string | string[] | Promise<string | string[]>;
/** Logger function. */
export type LoggerFn = (output?: any, title?: string) => void;
/** Handy type to cover printf. */
export type QueryWithString = (string: string) => string;
/** Amount type for migrations. */
export type AmountMigrateT = number | undefined;
/** Amount type for rollbacks. */
export type AmountRollbackT = AmountMigrateT | "all";
/** Query type. */
export type QueryT = string | string[];
/** Qhuery handler function. */
export type QueryHandler = (query: QueryT) => Promise<any>;
/** Type for migration files. */
export type MigrationFile = {
  up: Migration;
  down: Migration;
};

/** Client interface. Is to be implemented by every client. */
export interface ClientI {
  dialect: string;
  migrationFolder: string;
  seedFolder: string;
  migrationFiles: Deno.DirEntry[];
  seedFiles: Deno.DirEntry[];
  exposeQueryBuilder: boolean;
  prepare: () => Promise<void>;
  close: () => Promise<void>;
  migrate: (amount: AmountMigrateT) => Promise<void>;
  rollback: (amount: AmountRollbackT) => Promise<void>;
  seed: (matcher?: string) => Promise<void>;
  query: QueryHandler;
  setLogger: LoggerFn;
}

/** Nessie config options. */
export interface NessieConfig {
  client: ClientI;
  exposeQueryBuilder?: boolean;
}

/** Client config options. */
export interface ClientOptions {
  migrationFolder?: string;
  seedFolder?: string;
  [option: string]: any;
}
