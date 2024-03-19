import { MigrationClient } from "./mod.ts";

/** Exposed object in migration files. available in `up`/`down` methods.
 * queryBuilder is available when passing `exposeQueryBuilder: true` to the config file.
 */
// deno-lint-ignore ban-types
export type Context<T = undefined> = {};

/** Logger function. */
// deno-lint-ignore no-explicit-any
export type LoggerFn = (output?: any, title?: string) => void;
/** Amount type for migrations. */
export type AmountMigrateT = number | undefined;
/** Amount type for rollbacks. */
export type AmountRollbackT = AmountMigrateT | "all";

/** Nessie config options. */
export interface NessieConfig {
  /** Can be any class which extends `AbstractClient`. */
  // deno-lint-ignore no-explicit-any
  client: MigrationClient<any>;
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
  /** Custom migration template, can be path or url. When also using the CLI flag `--migrationTemplate`, it will have precidence. */
  migrationTemplate?: string;
  /** Custom seed template, can be path or url. When also using the CLI flag `--seedTemplate`, it will have precidence. */
  seedTemplate?: string;
  /** Enables verbose output for debugging */
  debug?: boolean;
}

export type FileEntryT = {
  name: string;
  path: string;
};

export interface StateOptions {
  debug: boolean;
  config: NessieConfig;
  migrationFolders: string[];
  seedFolders: string[];
  migrationFiles: FileEntryT[];
  seedFiles: FileEntryT[];
}
