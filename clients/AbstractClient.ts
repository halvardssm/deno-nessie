import { parsePath } from "../cli/utils.ts";
import { resolve } from "../deps.ts";
import { LoggerFn, QueryWithString, ClientOptions, AmountMigrateT, QueryHandler, MigrationFile, AmountRollbackT, Info } from "../types.ts";

export class AbstractClient {
  static readonly MAX_FILE_NAME_LENGTH = 100;

  protected TABLE_MIGRATIONS = "nessie_migrations";
  protected COL_FILE_NAME = "file_name";
  protected COL_CREATED_AT = "created_at";
  protected REGEX_MIGRATION_FILE_NAME = /^\d{10,14}-.+.ts$/;
  protected regexFileName = new RegExp(this.REGEX_MIGRATION_FILE_NAME);
  protected logger: LoggerFn = () => undefined;
  migrationFiles: Deno.DirEntry[];
  seedFiles: Deno.DirEntry[];
  migrationFolder: string;
  seedFolder: string;
  exposeQueryBuilder: boolean = false
  dialect: string = ""

  protected QUERY_GET_LATEST =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC LIMIT 1;`;
  protected QUERY_GET_ALL =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC;`;

  protected QUERY_MIGRATION_INSERT: QueryWithString = (fileName) =>
    `INSERT INTO ${this.TABLE_MIGRATIONS} (${this.COL_FILE_NAME}) VALUES ('${fileName}');`;
  protected QUERY_MIGRATION_DELETE: QueryWithString = (fileName) =>
    `DELETE FROM ${this.TABLE_MIGRATIONS} WHERE ${this.COL_FILE_NAME} = '${fileName}';`;

  constructor(options: string | ClientOptions) {
    if (typeof options === "string") {
      console.info(
        "DEPRECATED: Using string as the client option is deprecated, please use a config object instead.",
      );
      this.migrationFolder = resolve(options);
      this.seedFolder = resolve("./db/seeds");
    } else {
      this.migrationFolder = resolve(
        options.migrationFolder || "./db/migrations",
      );
      this.seedFolder = resolve(options.seedFolder || "./db/seeds");
    }

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

  protected async migrate(
    amount: AmountMigrateT,
    latestMigration: string | undefined,
    queryHandler: QueryHandler,
  ) {
    this.logger(amount, "Amount pre");

    this.filterAndSortFiles(latestMigration);
    amount = typeof amount === "number" ? amount : this.migrationFiles.length;

    this.logger(latestMigration, "Latest migrations");

    if (this.migrationFiles.length > 0) {
      this.logger(
        this.migrationFiles.map((el) => el.name),
        "Filtered and sorted migration files",
      );

      amount = Math.min(this.migrationFiles.length, amount);

      for (let i = 0;i < amount;i++) {
        const file = this.migrationFiles[i];

        await this._migrationHandler(file.name, queryHandler, true)

        console.info(`Migrated ${file.name}`);
      }
      console.info("Migration complete");
    } else {
      console.info("Nothing to migrate");
    }
  }

  filterAndSortFiles(queryResult: string | undefined): void {
    this.migrationFiles = this.migrationFiles
      .filter((file: Deno.DirEntry): boolean => {
        if (!this.regexFileName.test(file.name)) return false;
        if (queryResult === undefined) return true;
        return file.name > queryResult;
      })
      .sort((a, b) => parseInt(a?.name ?? "0") - parseInt(b?.name ?? "0"));
  }

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

      for (let i = 0;i < amount;i++) {
        const fileName = allMigrations[i];

        await this._migrationHandler(fileName, queryHandler, true)

        console.info(`Rolled back ${fileName}`);
      }
    } else {
      console.info("Nothing to rollback");
    }
  }

  splitAndTrimQueries(query: string) {
    return query.split(";").filter((el) => el.trim() !== "");
  }

  setLogger(fn: LoggerFn) {
    this.logger = fn;
  }

  async seed(matcher: string = ".+.ts", queryHandler: QueryHandler) {
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

  private async _migrationHandler(fileName: string, queryHandler: QueryHandler, isDown: boolean = false) {
    let { up, down }: MigrationFile = await import(
      parsePath(this.migrationFolder, fileName)
    );

    const exposedObject: Info = {
      dialect: this.dialect
    }

    if (this.exposeQueryBuilder) {
      exposedObject.queryBuilder = await import("https://deno.land/x/nessie/qb.ts")
    }

    let query: string | string[]

    if (isDown) {
      query = await down(exposedObject);
    } else {
      query = await up(exposedObject)
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
