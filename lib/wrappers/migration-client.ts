import {
  AbstractMigration,
  AbstractMigrationProps,
  AbstractSeed,
  AbstractSeedProps,
  AmountMigrateT,
  AmountRollbackT,
  COL_FILE_NAME,
  Context,
  DBDialects,
  FileEntryT,
  getDurationFromTimestamp,
  LoggerFn,
  NessieError,
  TABLE_MIGRATIONS,
} from "../mod.ts";
import { green } from "@std/fmt/colors";
import { AbstractConnection, Row } from "@db/sqlx";

export interface MigrationTable extends Row {
  id: number;
  file_name: string;
  created_at: string;
}

export interface MigrationClientOptions<Client> {
  dialect: DBDialects;
  client: Client;
}

/** The migration client which handles most of the logic related to database communication. */
export abstract class AbstractMigrationClient<
  // deno-lint-ignore no-explicit-any
  Client extends AbstractConnection<any, any, any>,
> {
  client: Client;
  /** Migration files read from the migration folders */
  migrationFiles: FileEntryT[] = [];
  /** Seed files read from the seed folders */
  seedFiles: FileEntryT[] = [];

  /** The current dialect, given by the Client e.g. pg, mysql, sqlite */
  readonly dialect?: DBDialects | string;
  protected logger: LoggerFn = () => undefined;

  abstract readonly QUERY_MIGRATION_TABLE_EXISTS: string;
  abstract readonly QUERY_CREATE_MIGRATION_TABLE: string;

  readonly QUERY_GET_LATEST: string =
    `SELECT * FROM ${TABLE_MIGRATIONS} ORDER BY ${COL_FILE_NAME} DESC LIMIT 1;`;
  readonly QUERY_GET_ALL: string =
    `SELECT * FROM ${TABLE_MIGRATIONS} ORDER BY ${COL_FILE_NAME} DESC;`;

  protected QUERY_MIGRATION_INSERT = (fileName: string): string =>
    `INSERT INTO ${TABLE_MIGRATIONS} (${COL_FILE_NAME}) VALUES ('${fileName}');`;
  protected QUERY_MIGRATION_DELETE = (fileName: string): string =>
    `DELETE FROM ${TABLE_MIGRATIONS} WHERE ${COL_FILE_NAME} = '${fileName}';`;

  constructor(options: MigrationClientOptions<Client>) {
    this.dialect = options.dialect;
    this.client = options.client;
  }

  /** Sets the logger for the client. Given by the State. */
  setLogger(fn: LoggerFn) {
    this.logger = fn;
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
    // deno-lint-ignore no-explicit-any
    const exposedObject: Context<any> = {
      dialect: this.dialect!,
    };

    const MigrationClass: new (
      props: AbstractMigrationProps<this>,
    ) => AbstractMigration<this> = (await import(file.path)).default;

    const migration = new MigrationClass({ client: this.client });

    if (isDown) {
      await migration.down(exposedObject);
      await this.client.execute(this.QUERY_MIGRATION_DELETE(file.name));
    } else {
      await migration.up(exposedObject);
      await this.client.execute(this.QUERY_MIGRATION_INSERT(file.name));
    }
  }

  async prepare(): Promise<void> {
    await this.client.connect();
    const queryResult = await this.client.query(
      this.QUERY_MIGRATION_TABLE_EXISTS,
    );

    const migrationTableExists = queryResult.length > 0;

    if (!migrationTableExists) {
      await this.client.execute(this.QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  /** Runs the `up` method on all available migrations after filtering and sorting. */
  async migrate(amount: AmountMigrateT): Promise<void> {
    const latestMigration = await this.client.query<MigrationTable>(
      this.QUERY_GET_LATEST,
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
      // deno-lint-ignore no-explicit-any
      const exposedObject: Context<any> = {
        dialect: this.dialect!,
      };

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
      this.QUERY_GET_ALL,
    );

    const parsedMigrations: string[] = allMigrations
      .map((entry) => entry.file_name);

    return parsedMigrations;
  }
}
