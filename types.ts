export type DBDialects = "pg" | "mysql" | "sqlite3";

export type Info = {
  dialect: DBDialects
  queryBuilder?: any
}

export type Migration = (info?: Info) => string | string[] | Promise<string | string[]>;
export type Seed = Migration;
export type LoggerFn = (output?: any, title?: string) => void;
export type QueryWithString = (string: string) => string;
export type AmountMigrateT = number | undefined;
export type AmountRollbackT = AmountMigrateT | "all";
export type QueryT = string | string[];
export type QueryHandler = (query: QueryT) => Promise<any>;
export type MigrationFile = {
  up: Migration;
  down: Migration;
};

export interface ClientI {
  dialect: string;
  migrationFolder: string;
  seedFolder: string;
  migrationFiles: Deno.DirEntry[];
  seedFiles: Deno.DirEntry[];
  exposeQueryBuilder: boolean
  prepare: () => Promise<void>;
  close: () => Promise<void>;
  migrate: (amount: AmountMigrateT) => Promise<void>;
  rollback: (amount: AmountRollbackT) => Promise<void>;
  seed: (matcher?: string) => Promise<void>;
  query: QueryHandler;
  setLogger: LoggerFn;
}

export interface NessieConfig {
  client: ClientI;
  exposeQueryBuilder?: boolean
}

export interface ClientOptions {
  migrationFolder?: string;
  seedFolder?: string;
  [option: string]: any;
}
