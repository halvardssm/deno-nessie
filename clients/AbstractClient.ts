import type {
  AbstractClientOptions,
  AmountMigrateT,
  AmountRollbackT,
  DBDialects,
  FileEntryT,
  Info,
  LoggerFn,
  QueryHandler,
  QueryT,
  QueryWithString,
} from "../types.ts";
import type {
  AbstractMigration,
  AbstractMigrationProps,
} from "../wrappers/AbstractMigration.ts";
import { AbstractSeed, AbstractSeedProps } from "../wrappers/AbstractSeed.ts";
import { COL_FILE_NAME, TABLE_MIGRATIONS } from "../consts.ts";
import { green } from "../deps.ts";
import { getDurationFromTimestamp } from "../cli/utils.ts";
import { NessieError } from "../cli/errors.ts";

/** The abstract client which handles most of the logic related to database communication. */
export abstract class AbstractClient<Client> {
  protected logger: LoggerFn = () => undefined;

  client: Client;
  /** Migration files read from the migration folders */
  migrationFiles: FileEntryT[] = [];
  /** Seed files read from the seed folders */
  seedFiles: FileEntryT[] = [];
  /** The current dialect, given by the Client e.g. pg, mysql, sqlite */
  dialect?: DBDialects | string;

  protected readonly QUERY_GET_LATEST =
    `SELECT ${COL_FILE_NAME} FROM ${TABLE_MIGRATIONS} ORDER BY ${COL_FILE_NAME} DESC LIMIT 1;`;
  protected readonly QUERY_GET_ALL =
    `SELECT ${COL_FILE_NAME} FROM ${TABLE_MIGRATIONS} ORDER BY ${COL_FILE_NAME} DESC;`;

  protected QUERY_MIGRATION_INSERT: QueryWithString = (fileName) =>
    `INSERT INTO ${TABLE_MIGRATIONS} (${COL_FILE_NAME}) VALUES ('${fileName}');`;
  protected QUERY_MIGRATION_DELETE: QueryWithString = (fileName) =>
    `DELETE FROM ${TABLE_MIGRATIONS} WHERE ${COL_FILE_NAME} = '${fileName}';`;

  constructor(options: AbstractClientOptions<Client>) {
    this.client = options.client;
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

  /** Runs the `up` method on all available migrations after filtering and sorting. */
  protected async _migrate(
    amount: AmountMigrateT,
    latestMigration: string | undefined,
    queryHandler: QueryHandler,
  ) {
    this.logger(amount, "Amount pre");
    this.logger(latestMigration, "Latest migrations");

    this._sliceMigrationFiles(latestMigration);
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

      await this._migrationHandler(file, queryHandler);

      const duration2 = getDurationFromTimestamp(t2);

      console.info(`Done in ${duration2} seconds\n----\n`);
    }

    const duration1 = getDurationFromTimestamp(t1);

    console.info(green(`Migrations completed in ${duration1} seconds`));
  }

  /** Runs the `down` method on defined number of migrations after retrieving them from the DB. */
  async _rollback(
    amount: AmountRollbackT,
    allMigrations: string[] | undefined,
    queryHandler: QueryHandler,
  ) {
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

      await this._migrationHandler(file, queryHandler, true);

      const duration2 = getDurationFromTimestamp(t2);

      console.info(`Done in ${duration2} seconds\n----\n`);
    }

    const duration1 = getDurationFromTimestamp(t1);

    console.info(green(`Rollback completed in ${duration1} seconds`));
  }

  /** Runs the `run` method on seed files. Filters on the matcher. */
  async _seed(matcher = ".+.ts") {
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
      // deno-lint-ignore no-explicit-any
      const exposedObject: Info<any> = {
        dialect: this.dialect!,
      };

      console.info(`Seeding ${file.name}`);

      const SeedClass: new (
        props: AbstractSeedProps<Client>,
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

  /** Sets the logger for the client. Given by the State. */
  setLogger(fn: LoggerFn) {
    this.logger = fn;
  }

  /** Splits and trims queries. */
  protected splitAndTrimQueries(query: string) {
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
    queryHandler: QueryHandler,
    isDown = false,
  ) {
    // deno-lint-ignore no-explicit-any
    const exposedObject: Info<any> = {
      dialect: this.dialect!,
    };

    const MigrationClass: new (
      props: AbstractMigrationProps<Client>,
    ) => AbstractMigration<this> = (await import(file.path)).default;

    const migration = new MigrationClass({ client: this.client });

    if (isDown) {
      await migration.down(exposedObject);
      await queryHandler(this.QUERY_MIGRATION_DELETE(file.name));
    } else {
      await migration.up(exposedObject);
      await queryHandler(this.QUERY_MIGRATION_INSERT(file.name));
    }
  }

  /** Prepares the db connection */
  abstract prepare(): Promise<void>;
  /** Updates timestamp format */
  abstract updateTimestamps(): Promise<void>;
  /** Closes the db connection */
  abstract close(): Promise<void>;
  /** Handles the migration */
  abstract migrate(amount: AmountMigrateT): Promise<void>;
  /** Handles the rollback */
  abstract rollback(amount: AmountRollbackT): Promise<void>;
  /** Handles the seeding */
  abstract seed(matcher?: string): Promise<void>;
  /** Universal wrapper for db query execution */
  // deno-lint-ignore no-explicit-any
  abstract query(query: QueryT): Promise<any>;
}
