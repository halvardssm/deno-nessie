/** The file `init` creates, and the CLI loads unless `--config` is given */
export const DEFAULT_CONFIG_FILE = "nessie.config.ts";
/** The folder migrations are read from and created in, unless configured */
export const DEFAULT_MIGRATION_FOLDER = "./db/migrations";
/** The folder seeds are read from and created in, unless configured */
export const DEFAULT_SEED_FOLDER = "./db/seeds";

/**
 * The length a migration file name must be shorter than. It is also the size
 * of the column the clients store the name in.
 */
export const MAX_FILE_NAME_LENGTH = 100;

/** Matches a valid migration file name, e.g. `20240101120000_create_users.ts` */
export const REGEXP_MIGRATION_FILE_NAME = /^\d{14}_[a-z\d]+(_[a-z\d]+)*\.ts$/;
/**
 * Matches a valid name for `make:migration` and `make:seed`: lower snake case
 * with digits, e.g. `create_users`.
 */
export const REGEXP_FILE_NAME = /^[a-z\d]+(_[a-z\d]+)*$/;
