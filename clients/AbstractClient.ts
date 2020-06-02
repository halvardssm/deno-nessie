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
  prepare: () => Promise<void>;
  close: () => Promise<void>;
  migrate: (amount: amountMigrateT) => Promise<void>;
  rollback: (amount: amountRollbackT) => Promise<void>;
  query: QueryHandler;
  setLogger: loggerFn;
}

export interface nessieConfig {
  client: ClientI;
}

export class AbstractClient {
  static readonly MAX_FILE_NAME_LENGTH = 100;

  protected TABLE_MIGRATIONS = "nessie_migrations";
  protected COL_FILE_NAME = "file_name";
  protected COL_CREATED_AT = "created_at";
  protected REGEX_MIGRATION_FILE_NAME = /^\d{10,14}-.+.ts$/;
  protected regexFileName = new RegExp(this.REGEX_MIGRATION_FILE_NAME);
  protected migrationFiles: Deno.DirEntry[];
  protected logger: loggerFn = () => undefined;
  migrationFolder: string;

  protected QUERY_GET_LATEST =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC LIMIT 1;`;
  protected QUERY_GET_ALL =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC;`;

  protected QUERY_MIGRATION_INSERT: QueryWithString = (fileName) =>
    `INSERT INTO ${this.TABLE_MIGRATIONS} (${this.COL_FILE_NAME}) VALUES ('${fileName}');`;
  protected QUERY_MIGRATION_DELETE: QueryWithString = (fileName) =>
    `DELETE FROM ${this.TABLE_MIGRATIONS} WHERE ${this.COL_FILE_NAME} = '${fileName}';`;

  constructor(migrationFolder: string) {
    this.migrationFolder = resolve(migrationFolder);
    this.migrationFiles = Array.from(Deno.readDirSync(this.migrationFolder));
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
}
