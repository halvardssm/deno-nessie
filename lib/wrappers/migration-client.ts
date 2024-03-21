import {
  AbstractMigration,
  AbstractMigrationProps,
  AbstractSeed,
  AbstractSeedProps,
  AmountMigrateT,
  AmountRollbackT,
  Context,
  FileEntryT,
  getDurationFromTimestamp,
  LoggerFn,
  MAX_FILE_NAME_LENGTH,
  NessieError,
} from "../mod.ts";
import { green } from "@std/fmt/colors";
import { AbstractConnection, Row } from "@db/sqlx";
import { RequiredPartialBy } from "@halvardm/js-helpers";

/**
 * Internal helper type for the connection instance.
 */
// deno-lint-ignore no-explicit-any
type AbstractConnectionInstance = AbstractConnection<any, any, any, any>;

/**
 * Internal helper type for the connection instance class.
 */
type AbstractConnectionClass = new (
  // deno-lint-ignore no-explicit-any
  ...args: any
) => AbstractConnectionInstance;

/**
 * The context for the migration table query.
 */
export type MigrationTableQueryContext = {
  /**
   * The name of the migration table.
   */
  table: string;
  /**
   * The name of the column for the migration id.
   */
  columnId: string;
  /**
   * The name of the column for the migration file name.
   */
  columnFileName: string;
  /**
   * The name of the column for the migration run date.
   */
  columnCreatedAt: string;
  /**
   * The maximum length of the migration file name.
   */
  maxFileNameLength: number;
  /**
   * The migration file name to insert or delete.
   *
   * Only available for `insertMigration` and `deleteMigration` queries.
   */
  migrationFileName: string;
};

/**
 * Query function for interacting with the migration table.
 */
export type MigrationTableQuery = (ctx: MigrationTableQueryContext) => string;

/**
 * The migration table.
 */
export interface MigrationTable extends Row<unknown> {
  /**
   * The id of the migration.
   */
  id: number;
  /**
   * The name of the migration file.
   */
  file_name: string;
  /**
   * The date the migration was run.
   */
  created_at: string;
}

/**
 * The queries used by the migration client.
 */
export type MigrationClientQueries = {
  /**
   * Query to check if the migration table exists.
   *
   * Must return 0 rows if the table does not exist.
   * If the table exists, it must return 1 or more rows.
   */
  migrationTableExists: MigrationTableQuery;
  /**
   * Query to create the migration table.
   */
  createMigrationTable: MigrationTableQuery;
  /**
   * Query to get the latest migration.
   */
  getLatestMigration: MigrationTableQuery;
  /**
   * Query to get all migrations.
   */
  getAllMigrations: MigrationTableQuery;
  /**
   * Query to insert a migration.
   */
  insertMigration: MigrationTableQuery;
  /**
   * Query to delete a migration.
   */
  deleteMigration: MigrationTableQuery;
};

/**
 * The options for the migration client.
 */
export interface MigrationClientOptions<
  Client extends AbstractConnectionInstance,
> {
  /**
   * The dialect of the migration client.
   */
  dialect: string;
  /**
   * The database connection to be used by the migration client.
   */
  client: Client;
  /**
   * Dialect specific queries to be used by the migration client.
   */
  queries: RequiredPartialBy<
    MigrationClientQueries,
    "migrationTableExists" | "createMigrationTable"
  >;
}

/**
 * The options for the migration client.
 * Used by inherited classes as these should be set by the inheriting class.
 */
export type InheritedMigrationClientOptions<
  Client extends AbstractConnectionClass,
> =
  & Omit<
    Partial<
      MigrationClientOptions<InstanceType<Client>>
    >,
    "client" | "queries"
  >
  & {
    /**
     * The client to be used by the migration client.
     * Optionally, it takes the constructor parameters for the client as an array.
     *
     * @example
     * ```ts
     * const client = new PostgresConnection({ client: new PostgresConnection("url", connectionOptions) });
     * const client = new PostgresConnection({ client: ["url", connectionOptions] });
     * ```
     */
    client: InstanceType<Client> | ConstructorParameters<Client>;
    /**
     * Dialect specific queries to be used by the migration client. Overrides the default queries.
     */
    queries?: Partial<MigrationClientOptions<InstanceType<Client>>["queries"]>;
  };

/**
 * The migration client which handles most of the logic related to database communication.
 *
 * This class is meant to be inherited by the dialect specific migration clients.
 */
export class MigrationClient<
  Client extends AbstractConnectionClass,
> {
  client: InstanceType<Client>;
  /** Migration files read from the migration folders */
  migrationFiles: FileEntryT[] = [];
  /** Seed files read from the seed folders */
  seedFiles: FileEntryT[] = [];

  protected logger: LoggerFn = () => undefined;

  readonly queries: MigrationClientQueries;

  constructor(options: MigrationClientOptions<InstanceType<Client>>) {
    this.client = options.client;

    const defaultQueries: Omit<
      MigrationClientQueries,
      "migrationTableExists" | "createMigrationTable"
    > = {
      getLatestMigration: (ctx) =>
        `SELECT * FROM ${ctx.table} ORDER BY ${ctx.columnFileName} DESC LIMIT 1;`,
      getAllMigrations: (ctx) =>
        `SELECT * FROM ${ctx.table} ORDER BY ${ctx.columnFileName} DESC;`,
      insertMigration: (ctx) =>
        `INSERT INTO ${ctx.table} (${ctx.columnFileName}) VALUES ('${ctx.migrationFileName}');`,
      deleteMigration: (ctx) =>
        `DELETE FROM ${ctx.table} WHERE ${ctx.columnFileName} = '${ctx.migrationFileName}';`,
    };

    this.queries = {
      ...defaultQueries,
      ...options.queries,
    };
  }

  /** Sets the logger for the client. Given by the State. */
  setLogger(fn: LoggerFn) {
    this.logger = fn;
  }

  protected _getMigrationTableQueryContext(
    fileName?: string,
  ): MigrationTableQueryContext {
    return {
      table: "nessie_migrations",
      columnId: "id",
      columnFileName: "file_name",
      columnCreatedAt: "created_at",
      maxFileNameLength: MAX_FILE_NAME_LENGTH,
      migrationFileName: fileName || "",
    };
  }

  protected _parseAmount(
    amount: AmountRollbackT,
    maxAmount = 0,
    isMigration = true,
  ): number {
    const defaultAmount = isMigration ? maxAmount : 1;

    if (amount === "all") return maxAmount;
    if (amount === undefined) return defaultAmount;
    if (typeof amount === "string") {
      amount = isNaN(parseInt(amount)) ? defaultAmount : parseInt(amount);
    }
    return Math.min(maxAmount, amount);
  }

  /** Splits and trims queries. */
  protected splitAndTrimQueries(query: string): string[] {
    return query.split(";").filter((el) => el.trim() !== "");
  }

  /** Filters and sort files in ascending order. */
  private _sliceMigrationFiles(queryResult: string | undefined): void {
    if (!queryResult) return;

    const sliceIndex = this.migrationFiles
      .findIndex((file) => file.name >= queryResult);

    if (sliceIndex !== undefined) {
      this.migrationFiles = this.migrationFiles.slice(sliceIndex + 1);
    }
  }

  /** Handles migration files. */
  private async _migrationHandler(
    file: FileEntryT,
    isDown = false,
  ) {
    const exposedObject: Context<unknown> = {};

    const MigrationClass: new (
      props: AbstractMigrationProps<this>,
    ) => AbstractMigration<this> = (await import(file.path)).default;

    const migration = new MigrationClass({ client: this.client });

    if (isDown) {
      await migration.down(exposedObject);
      await this.client.execute(
        this.queries.deleteMigration(
          this._getMigrationTableQueryContext(file.name),
        ),
      );
    } else {
      await migration.up(exposedObject);
      await this.client.execute(
        this.queries.insertMigration(
          this._getMigrationTableQueryContext(file.name),
        ),
      );
    }
  }

  async prepare(): Promise<void> {
    await this.client.connect();
    const queryResult = await this.client.query(
      this.queries.migrationTableExists(this._getMigrationTableQueryContext()),
    );

    const migrationTableExists = queryResult.length > 0;

    if (!migrationTableExists) {
      await this.client.execute(
        this.queries.createMigrationTable(
          this._getMigrationTableQueryContext(),
        ),
      );
      console.info("Database setup complete");
    }
  }

  /** Runs the `up` method on all available migrations after filtering and sorting. */
  async migrate(amount: AmountMigrateT): Promise<void> {
    const latestMigration = await this.client.query<MigrationTable>(
      this.queries.getLatestMigration(this._getMigrationTableQueryContext()),
    );
    const latestMigrationName = latestMigration[0]?.file_name;

    this.logger(amount, "Amount pre");
    this.logger(latestMigrationName, "Latest migrations");

    this._sliceMigrationFiles(latestMigrationName);
    amount = this._parseAmount(amount, this.migrationFiles.length, true);

    this.logger(
      this.migrationFiles,
      "Filtered and sorted migration files",
    );

    if (amount < 1) {
      console.info("Nothing to migrate");
      return;
    }

    console.info(
      green(`Starting migration of ${this.migrationFiles.length} files`),
      "\n----\n",
    );

    const t1 = performance.now();

    for (const [i, file] of this.migrationFiles.entries()) {
      if (i >= amount) break;

      console.info(green(`Migrating ${file.name}`));

      const t2 = performance.now();

      await this._migrationHandler(file);

      const duration2 = getDurationFromTimestamp(t2);

      console.info(`Done in ${duration2} seconds\n----\n`);
    }

    const duration1 = getDurationFromTimestamp(t1);

    console.info(green(`Migrations completed in ${duration1} seconds`));
  }

  /** Runs the `down` method on defined number of migrations after retrieving them from the DB. */
  async rollback(amount: AmountRollbackT): Promise<void> {
    const allMigrations = await this.getAllMigrations();

    this.logger(allMigrations, "Files to rollback");
    this.logger(amount, "Amount pre");

    if (!allMigrations || allMigrations.length < 1) {
      console.info("Nothing to rollback");
      return;
    }

    amount = this._parseAmount(amount, allMigrations.length, false);
    this.logger(amount, "Received amount to rollback");

    console.info(
      green(`Starting rollback of ${amount} files`),
      "\n----\n",
    );

    const t1 = performance.now();

    for (const [i, fileName] of allMigrations.entries()) {
      if (i >= amount) break;

      const file = this.migrationFiles
        .find((migrationFile) => migrationFile.name === fileName);

      if (!file) {
        throw new NessieError(`Migration file '${fileName}' is not found`);
      }

      console.info(`Rolling back ${file.name}`);

      const t2 = performance.now();

      await this._migrationHandler(file, true);

      const duration2 = getDurationFromTimestamp(t2);

      console.info(`Done in ${duration2} seconds\n----\n`);
    }

    const duration1 = getDurationFromTimestamp(t1);

    console.info(green(`Rollback completed in ${duration1} seconds`));
  }

  /** Runs the `run` method on seed files. Filters on the matcher. */
  async seed(matcher = ".+.ts"): Promise<void> {
    const files = this.seedFiles.filter((el) =>
      el.name === matcher || new RegExp(matcher).test(el.name)
    );

    if (files.length < 1) {
      console.info(`No seed file found with matcher '${matcher}'`);
      return;
    }

    console.info(
      green(`Starting seeding of ${files.length} files`),
      "\n----\n",
    );

    const t1 = performance.now();

    for await (const file of files) {
      const exposedObject: Context<unknown> = {};

      console.info(`Seeding ${file.name}`);

      const SeedClass: new (
        props: AbstractSeedProps<this>,
      ) => AbstractSeed<this> = (await import(file.path)).default;

      const seed = new SeedClass({ client: this.client });

      const t2 = performance.now();

      await seed.run(exposedObject);

      const duration2 = getDurationFromTimestamp(t2);

      console.info(`Done in ${duration2} seconds\n----\n`);
    }

    const duration1 = getDurationFromTimestamp(t1);

    console.info(green(`Seeding completed in ${duration1} seconds`));
  }

  async getAllMigrations(): Promise<string[]> {
    const allMigrations = await this.client.query<MigrationTable>(
      this.queries.getAllMigrations(this._getMigrationTableQueryContext()),
    );

    const parsedMigrations: string[] = allMigrations
      .map((entry) => entry.file_name);

    return parsedMigrations;
  }
}
