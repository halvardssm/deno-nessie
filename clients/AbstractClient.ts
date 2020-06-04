import { parsePath } from "../cli/utils.ts";
import { resolve } from "../deps.ts";
import { loggerFn } from "../cli/state.ts";
import { Migration } from "../types.ts";

export type QueryWithString = (string: string) => string;

export type amountMigrateT = number | undefined;
export type amountRollbackT = amountMigrateT | "all";
export type queryT = string | string[];
export type QueryHandler = (query: queryT) => Promise<any>;
export type MigrationFile = {
  up: Migration;
  down: Migration;
};

export interface ClientI {
  migrationFolder: string;
  seedFolder: string;
  migrationFiles: Deno.DirEntry[];
  seedFiles: Deno.DirEntry[];
  prepare: () => Promise<void>;
  close: () => Promise<void>;
  migrate: (amount: amountMigrateT) => Promise<void>;
  rollback: (amount: amountRollbackT) => Promise<void>;
  seed: (matcher?: string) => Promise<void>;
  query: QueryHandler;
  setLogger: loggerFn;
}

export interface nessieConfig {
  client: ClientI;
}

export interface ClientOptions {
  migrationFolder: string;
  seedFolder: string;
  [option: string]: any;
}

export class AbstractClient {
  static readonly MAX_FILE_NAME_LENGTH = 100;

  protected TABLE_MIGRATIONS = "nessie_migrations";
  protected COL_FILE_NAME = "file_name";
  protected COL_CREATED_AT = "created_at";
  protected REGEX_MIGRATION_FILE_NAME = /^\d{10,14}-.+.ts$/;
  protected regexFileName = new RegExp(this.REGEX_MIGRATION_FILE_NAME);
  protected logger: loggerFn = () => undefined;
  migrationFiles: Deno.DirEntry[];
  seedFiles: Deno.DirEntry[];
  migrationFolder: string;
  seedFolder: string;

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
    this.migrationFiles = Array.from(Deno.readDirSync(this.migrationFolder));
    this.seedFiles = Array.from(Deno.readDirSync(this.seedFolder));
  }

  protected async migrate(
    amount: amountMigrateT,
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

      for (let i = 0; i < amount; i++) {
        const file = this.migrationFiles[i];
        let { up }: MigrationFile = await import(
          parsePath(this.migrationFolder, file.name)
        );

        let query = await up();

        if (!query) query = [];
        else if (typeof query === "string") query = [query];

        query.push(this.QUERY_MIGRATION_INSERT(file.name));

        await queryHandler(query);

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
    amount: amountRollbackT,
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
        let { down }: MigrationFile = await import(
          parsePath(this.migrationFolder, fileName)
        );

        let query = await down();

        if (!query) query = [];
        else if (typeof query === "string") query = [query];

        query.push(this.QUERY_MIGRATION_DELETE(fileName));

        await queryHandler(query);

        console.info(`Rolled back ${fileName}`);
      }
    } else {
      console.info("Nothing to rollback");
    }
  }

  splitAndTrimQueries(query: string) {
    return query.split(";").filter((el) => el.trim() !== "");
  }

  setLogger(fn: loggerFn) {
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
}
