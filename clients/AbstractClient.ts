import { parsePath } from '../cli/utils.ts';
import { resolve } from "../deps.ts";

export type QueryWithString = (string: string) => string

export class AbstractClient {
  static readonly MAX_FILE_NAME_LENGTH = 100;

  protected TABLE_MIGRATIONS = "nessie_migrations";
  protected COL_FILE_NAME = "file_name";
  protected COL_CREATED_AT = "created_at";
  protected REGEX_MIGRATION_FILE_NAME = /^\d{10,14}-.+.ts$/;
  protected regexFileName = new RegExp(this.REGEX_MIGRATION_FILE_NAME);
  protected migrationFiles: Deno.DirEntry[]
  migrationFolder: string

  protected QUERY_GET_LATEST =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC LIMIT 1`;
  protected QUERY_GET_ALL =
    `SELECT ${this.COL_FILE_NAME} FROM ${this.TABLE_MIGRATIONS} ORDER BY ${this.COL_FILE_NAME} DESC`;

  protected QUERY_MIGRATION_INSERT: QueryWithString = (fileName) =>
    `INSERT INTO ${this.TABLE_MIGRATIONS} (${this.COL_FILE_NAME}) VALUES ('${fileName}');`;
  protected QUERY_MIGRATION_DELETE: QueryWithString = (fileName) =>
    `DELETE FROM ${this.TABLE_MIGRATIONS} WHERE ${this.COL_FILE_NAME} = '${fileName}';`;

  constructor(migrationFolder: string) {
    this.migrationFolder = resolve(migrationFolder)
    this.migrationFiles = Array.from(Deno.readDirSync(this.migrationFolder));
  }

  protected async migrate(latestMigration: string | undefined, queryHandler: (query: string) => Promise<any>) {
    this.filterAndSortFiles(latestMigration)

    if (this.migrationFiles.length > 0) {
      for await (const file of this.migrationFiles) {
        let { up } = await import(parsePath(this.migrationFolder, file.name));

        let query: string = await up();

        if (!query.endsWith(';')) query += ';'

        query += this.QUERY_MIGRATION_INSERT(file.name);

        await queryHandler(query)

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

  async rollback(allMigrations: string[] | undefined, queryHandler: (query: string) => Promise<any>) {
    if (allMigrations) {
      for await (const fileName of allMigrations) {
        let { down } = await import(parsePath(this.migrationFolder, fileName));

        let query: string = await down();

        query += this.QUERY_MIGRATION_DELETE(fileName);

        await queryHandler(query);

        console.info(`Rolled back ${fileName}`);
      }
    } else {
      console.info("Nothing to rollback");
    }
  }
}