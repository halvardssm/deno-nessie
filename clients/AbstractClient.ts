import { parsePath } from "../cli/utils.ts";
import { resolve } from "../deps.ts";
import type {
  AmountMigrateT,
  AmountRollbackT,
  AbstractClientOptions,
  DBDialects,
  Info,
  LoggerFn,
  MigrationFile,
  QueryHandler,
  QueryWithString,
} from "../types.ts";
import type {
  AbstractMigration,
  AbstractMigrationProps,
} from "../wrappers/AbstractMigration.ts";

/** The abstract client which handles most of the logic related to database communication. */
export abstract class AbstractClient<Client> {
  static readonly MAX_FILE_NAME_LENGTH = 100;

  protected readonly TABLE_MIGRATIONS = "nessie_migrations";
  protected readonly COL_FILE_NAME = "file_name";
  protected readonly COL_CREATED_AT = "created_at";
  protected readonly REGEX_MIGRATION_FILE_NAME = /^\d{10,14}-.+.ts$/;
  protected readonly regexFileName = new RegExp(this.REGEX_MIGRATION_FILE_NAME);

  protected logger: LoggerFn = () => undefined;

  client: Client;
  migrationFiles: Deno.DirEntry[];
  seedFiles: Deno.DirEntry[];
  migrationFolder: string;
  seedFolder: string;
  experimental: boolean;
  exposeQueryBuilder = false;
  dialect?: DBDialects;

  protected readonly QUERY_GET_LATEST =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC LIMIT 1;`;
  protected readonly QUERY_GET_ALL =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC;`;

  protected QUERY_MIGRATION_INSERT: QueryWithString = (fileName) =>
    `INSERT INTO ${this.TABLE_MIGRATIONS} (${this.COL_FILE_NAME}) VALUES ('${fileName}');`;
  protected QUERY_MIGRATION_DELETE: QueryWithString = (fileName) =>
    `DELETE FROM ${this.TABLE_MIGRATIONS} WHERE ${this.COL_FILE_NAME} = '${fileName}';`;

  constructor(options: AbstractClientOptions<Client>) {
    this.migrationFolder = resolve(
      options.migrationFolder || "./db/migrations",
    );
    this.seedFolder = resolve(options.seedFolder || "./db/seeds");
    this.client = options.client;
    this.experimental = options.experimental || false;

    try {
      this.migrationFiles = Array.from(Deno.readDirSync(this.migrationFolder));
    } catch {
      this.logger(`Migration folder not found at '${this.migrationFolder}'`);
      this.migrationFiles = [];
    }

    try {
      this.seedFiles = Array.from(Deno.readDirSync(this.seedFolder));
    } catch {
      this.logger(`Seed folder not found at '${this.seedFolder}'`);
      this.seedFiles = [];
    }
  }

  /** Runs the `up` method on all available migrations after filtering and sorting. */
  protected async migrate(
    amount: AmountMigrateT,
    latestMigration: string | undefined,
    queryHandler: QueryHandler,
  ) {
    this.logger(amount, "Amount pre");

    this._filterAndSortFiles(latestMigration);
    amount = typeof amount === "number" ? amount : this.migrationFiles.length;

    this.logger(latestMigration, "Latest migrations");

    if (this.migrationFiles.length > 0) {
      this.logger(
        this.migrationFiles.map((el) => el.name),
        "Filtered and sorted migration files",
      );

      amount = Math.min(this.migrationFiles.length, amount);

      for (let i = 0; i < amount; i++) {
        const file = this.migrationFiles[i];

        await this._migrationHandler(file.name, queryHandler);

        console.info(`Migrated ${file.name}`);
      }
      console.info("Migration complete");
    } else {
      console.info("Nothing to migrate");
    }
  }

  /** Runs the `down` method on defined number of migrations after retrieving them from the DB. */
  async rollback(
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

      for (let i = 0; i < amount; i++) {
        const fileName = allMigrations[i];

        await this._migrationHandler(fileName, queryHandler, true);

        console.info(`Rolled back ${fileName}`);
      }
    } else {
      console.info("Nothing to rollback");
    }
  }

  /** Runs the `run` method on seed files. Filters on the matcher. */
  async seed(matcher = ".+.ts", queryHandler: QueryHandler) {
    const files = this.seedFiles.filter((el) =>
      el.isFile && (el.name === matcher || new RegExp(matcher).test(el.name))
    );

    if (!files) {
      console.info(
        `No seed file found at '${this.seedFolder}' with matcher '${matcher}'`,
      );
      return;
    } else {
      for await (const file of files) {
        const filePath = parsePath(this.seedFolder, file.name);

        const { run } = await import(filePath);
        const sql = await run();

        await queryHandler(sql);
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
  private _filterAndSortFiles(queryResult: string | undefined): void {
    this.migrationFiles = this.migrationFiles
      .filter((file: Deno.DirEntry): boolean => {
        if (!this.regexFileName.test(file.name)) return false;
        if (queryResult === undefined) return true;
        return file.name > queryResult;
      })
      .sort((a, b) => parseInt(a?.name ?? "0") - parseInt(b?.name ?? "0"));
  }

  /** 
   * Handles migration files. 
   * 
   * TODO on next major bump, remove non expreimental code
   */
  private async _migrationHandler(
    fileName: string,
    queryHandler: QueryHandler,
    isDown = false,
  ) {
    const exposedObject: Info<any> = {
      dialect: this.dialect!,
      connection: queryHandler,
      queryBuilder: undefined,
    };

    if (this.exposeQueryBuilder) {
      const { Schema } = await import("https://deno.land/x/nessie/qb.ts");
      exposedObject.queryBuilder = new Schema(this.dialect);
    }

    if (this.experimental) {
      const MigrationClass: new (
        props: AbstractMigrationProps<Client>,
      ) => AbstractMigration<Client> = await import(
        parsePath(
          this.migrationFolder,
          fileName,
        )
      );

      const migration = new MigrationClass({ client: this.client });

      if (isDown) {
        await migration.down(exposedObject);
      } else {
        await migration.up(exposedObject);
      }
    } else {
      let { up, down }: MigrationFile = await import(parsePath(
        this.migrationFolder,
        fileName,
      ));

      let query: string | string[];

      if (isDown) {
        query = await down(exposedObject);
      } else {
        query = await up(exposedObject);
      }

      if (!query) query = [];
      else if (typeof query === "string") query = [query];

      if (isDown) {
        query.push(this.QUERY_MIGRATION_DELETE(fileName));
      } else {
        query.push(this.QUERY_MIGRATION_INSERT(fileName));
      }

      await queryHandler(query);
    }
  }
}
