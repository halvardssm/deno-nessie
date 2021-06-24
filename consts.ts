export const VERSION = "2.0.0";

export const URL_BASE = `https://deno.land/x/nessie`;
export const URL_BASE_VERSIONED = `${URL_BASE}@${VERSION}`;

export const URL_TEMPLATE_BASE = `${URL_BASE}/cli/templates/`;
export const URL_TEMPLATE_BASE_VERSIONED =
  `${URL_BASE_VERSIONED}/cli/templates/`;

export const DEFAULT_CONFIG_FILE = "nessie.config.ts";
export const DEFAULT_MIGRATION_FOLDER = "./db/migrations";
export const DEFAULT_SEED_FOLDER = "./db/seeds";

export const MAX_FILE_NAME_LENGTH = 100;
export const TABLE_MIGRATIONS = "nessie_migrations";
export const COL_FILE_NAME = "file_name";
export const COL_CREATED_AT = "created_at";
export const REGEXP_MIGRATION_FILE_NAME_LEGACY = /^\d{10,14}-.+.ts$/;
/** RegExp to validate the file name */
export const REGEXP_MIGRATION_FILE_NAME = /^\d{14}_[a-z\d]+(_[a-z\d]+)*.ts$/;
export const REGEXP_FILE_NAME = /^[a-z\d]+(_[a-z\d]+)*$/;

export enum DB_DIALECTS {
  PGSQL = "pg",
  MYSQL = "mysql",
  SQLITE = "sqlite",
}

export enum DB_CLIENTS {
  pg = "ClientPostgreSQL",
  mysql = "ClientMySQL",
  sqlite = "ClientSQLite",
}
