export const VERSION = "1.2.3";

export const URL_BASE = `https://deno.land/x/nessie`;

export const URL_TEMPLATE_BASE = `${URL_BASE}/cli/templates/`;
export const URL_TEMPLATE_BASE_VERSIONED =
  `${URL_BASE}@${VERSION}/cli/templates/`;

export const DEFAULT_CONFIG_FILE = "nessie.config.ts";
export const DEFAULT_MIGRATION_FOLDER = "./db/migrations";
export const DEFAULT_SEED_FOLDER = "./db/seeds";

export const STD_CLIENT_OPTIONS = {
  migrationFolder: DEFAULT_MIGRATION_FOLDER,
  seedFolder: DEFAULT_SEED_FOLDER,
  experimental: true,
};

export const MAX_FILE_NAME_LENGTH = 100;
export const TABLE_MIGRATIONS = "nessie_migrations";
export const COL_FILE_NAME = "file_name";
export const COL_CREATED_AT = "created_at";
export const REGEX_MIGRATION_FILE_NAME_LEGACY = /^\d{10,14}-.+.ts$/;
export const REGEX_MIGRATION_FILE_NAME = /^\d{14}-.{0,235}.ts$/;
