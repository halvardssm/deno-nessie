import { resolve } from "../deps.ts";
import type {
  AbstractClientOptions,
  AmountMigrateT,
  AmountRollbackT,
  DBDialects,
  FileEntryT,
  Info,
  LoggerFn,
  MigrationFile,
  QueryHandler,
  QueryT,
  QueryWithString,
} from "../types.ts";
import type {
  AbstractMigration,
  AbstractMigrationProps,
} from "../wrappers/AbstractMigration.ts";
import { AbstractSeed, AbstractSeedProps } from "../wrappers/AbstractSeed.ts";
import {
  COL_FILE_NAME,
  DEFAULT_MIGRATION_FOLDER,
  DEFAULT_SEED_FOLDER,
  TABLE_MIGRATIONS,
} from "../consts.ts";
import { isValidMigrationName, parsePath } from "../cli/utils.ts";

/** The abstract client which handles most of the logic related to database communication. */
export abstract class AbstractClient<Client> {
  protected logger: LoggerFn = () => undefined;

  client: Client;
  /** Migration files read from the migration folders */
  migrationFiles: FileEntryT[] = [];
  /** Seed files read from the seed folders */
  seedFiles: FileEntryT[] = [];
  /** Migration folders given from the config file */
  migrationFolders: string[] = [];
  /** Seed folders given from the config file */
  seedFolders: string[] = [];
  experimental = false;
  /** The current dialect, given by the Client e.g. pg, mysql, sqlite3 */
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

    this._parseMigrationAndSeedFolders(options);
    this._parseMigrationAndSeedFiles();
  }

  isExperimental() {
    this.experimental = true;
  }

  /** Runs the `up` method on all available migrations after filtering and sorting. */
  protected async _migrate(
    amount: AmountMigrateT,
    latestMigration: string | undefined,
    queryHandler: QueryHandler,
  ) {
    this.logger(amount, "Amount pre");

    this._sliceMigrationFiles(latestMigration);
    amount = typeof amount === "number" ? amount : this.migrationFiles.length;

    this.logger(latestMigration, "Latest migrations");

    if (this.migrationFiles.length > 0) {
      this.logger(
        this.migrationFiles,
        "Filtered and sorted migration files",
      );

      amount = Math.min(this.migrationFiles.length, amount);

      for (const [i, file] of this.migrationFiles.entries()) {
        if (i >= amount) break;

        await this._migrationHandler(file, queryHandler);

        console.info(`Migrated ${file.name}`);
      }
      console.info("Migration complete");
    } else {
      console.info("Nothing to migrate");
    }
  }

  /** Runs the `down` method on defined number of migrations after retrieving them from the DB. */
  async _rollback(
    amount: AmountRollbackT,
    allMigrations: string[] | undefined,
    queryHandler: QueryHandler,
  ) {
    this.logger(amount, "Amount pre");

    amount = typeof amount === "number"
      ? amount
      : (amount === "all" ? (allMigrations?.length ? allMigrations.length : 0)
      : 1);

    this.logger(amount, "Received amount to rollback");
    this.logger(allMigrations, "Files to rollback");

    if (allMigrations && allMigrations.length > 0) {
      amount = Math.min(allMigrations.length, amount);

      for (const [i, fileName] of allMigrations.entries()) {
        if (i >= amount) break;

        const file = this.migrationFiles
          .find((migrationFile) => migrationFile.name === fileName);

        if (!file) {
          throw new Error(`Migration file '${fileName}' is not found`);
        }

        await this._migrationHandler(file, queryHandler, true);

        console.info(`Rolled back ${file.name}`);
      }
    } else {
      console.info("Nothing to rollback");
    }
  }

  /** Runs the `run` method on seed files. Filters on the matcher. */
  async _seed(matcher = ".+.ts", queryHandler: QueryHandler) {
    const files = this.seedFiles.filter((el) =>
      el.name === matcher || new RegExp(matcher).test(el.name)
    );

    if (files.length < 1) {
      console.info(`No seed file found with matcher '${matcher}'`);
      return;
    } else {
      for await (const file of files) {
        if (this.experimental) {
          // deno-lint-ignore no-explicit-any
          const exposedObject: Info<any> = {
            dialect: this.dialect!,
            connection: queryHandler,
          };

          const SeedClass: new (
            props: AbstractSeedProps<Client>,
          ) => AbstractSeed<this> = (await import(file.path)).default;

          const seed = new SeedClass({ client: this.client });
          await seed.run(exposedObject);
        } else {
          const { run } = await import(file.path);
          const sql = await run();

          await queryHandler(sql);
        }
      }

      console.info("Seeding complete");
    }
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

  /**
   * Handles migration files.
   *
   * TODO on next major bump, remove non expreimental code
   */
  private async _migrationHandler(
    file: FileEntryT,
    queryHandler: QueryHandler,
    isDown = false,
  ) {
    // deno-lint-ignore no-explicit-any
    const exposedObject: Info<any> = {
      dialect: this.dialect!,
      connection: queryHandler,
    };

    if (this.experimental) {
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
    } else {
      const { up, down }: MigrationFile = await import(file.path);

      let query: string | string[];

      if (isDown) {
        query = await down(exposedObject);
      } else {
        query = await up(exposedObject);
      }

      if (!query) query = [];
      else if (typeof query === "string") query = [query];

      if (isDown) {
        query.push(this.QUERY_MIGRATION_DELETE(file.name));
      } else {
        query.push(this.QUERY_MIGRATION_INSERT(file.name));
      }

      await queryHandler(query);
    }
  }

  /** Checks if an array only contains unique values */
  private _arrayIsUnique(array: unknown[]): boolean {
    return array.length === new Set(array).size;
  }

  /** Parses and sets the migrationFolders and seedFolders */
  private _parseMigrationAndSeedFolders(
    options: AbstractClientOptions<Client>,
  ): void {
    if (
      options.migrationFolders && !this._arrayIsUnique(options.migrationFolders)
    ) {
      throw new Error("Entries for the migration folders has to be unique");
    }

    if (options.seedFolders && !this._arrayIsUnique(options.seedFolders)) {
      throw new Error("Entries for the seed folders has to be unique");
    }

    options.migrationFolders?.forEach((folder) => {
      this.migrationFolders.push(resolve(Deno.cwd(), folder));
    });

    if (this.migrationFolders.length < 1) {
      this.migrationFolders.push(resolve(
        Deno.cwd(),
        options.migrationFolder || DEFAULT_MIGRATION_FOLDER,
      ));
    }

    if (!this._arrayIsUnique(this.migrationFolders)) {
      throw new Error(
        "Entries for the resolved migration folders has to be unique",
      );
    }

    options.seedFolders?.forEach((folder) => {
      this.seedFolders.push(resolve(Deno.cwd(), folder));
    });

    if (this.seedFolders.length < 1) {
      this.seedFolders.push(resolve(
        Deno.cwd(),
        options.seedFolder || DEFAULT_SEED_FOLDER,
      ));
    }

    if (!this._arrayIsUnique(this.seedFolders)) {
      throw new Error(
        "Entries for the resolved seed folders has to be unique",
      );
    }
  }

  /** Parses and sets the migrationFiles and seedFiles */
  private _parseMigrationAndSeedFiles(): void {
    this.migrationFolders.forEach((folder) => {
      const filesRaw: FileEntryT[] = Array.from(Deno.readDirSync(folder))
        .filter((file) =>
          file.isFile &&
          isValidMigrationName(file.name, true, this.experimental)
        )
        .map((file) => ({
          name: file.name,
          path: parsePath(folder, file.name),
        }));

      this.migrationFiles.push(...filesRaw);
    });

    if (!this._arrayIsUnique(this.migrationFiles.map((file) => file.name))) {
      throw new Error(
        "Entries for the migration files has to be unique",
      );
    }

    this.migrationFiles.sort((a, b) => parseInt(a.name) - parseInt(b.name));

    this.seedFolders.forEach((folder) => {
      const filesRaw = Array.from(Deno.readDirSync(folder))
        .filter((file) => file.isFile)
        .map((file) => ({
          name: file.name,
          path: parsePath(folder, file.name),
        }));

      this.seedFiles.push(...filesRaw);
    });

    if (!this._arrayIsUnique(this.seedFiles.map((file) => file.name))) {
      throw new Error(
        "Entries for the resolved seed files has to be unique",
      );
    }

    this.seedFiles.sort((a, b) => a.name.localeCompare(b.name));
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
