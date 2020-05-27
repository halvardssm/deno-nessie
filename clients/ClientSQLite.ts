import { DB, open, save } from "https://deno.land/x/sqlite@v1.0.0/mod.ts";
import { ClientI } from "../cli/utils.ts";
import { AbstractClient } from './AbstractClient.ts';

export class ClientSQLite extends AbstractClient implements ClientI {
  private client?: DB;
  private clientOptions: string

  private QUERY_MIGRATION_TABLE_EXISTS = `SELECT name FROM sqlite_master WHERE type='table' AND name='${this.TABLE_MIGRATIONS}';`
  private QUERY_CREATE_MIGRATION_TABLE = `CREATE TABLE ${this.TABLE_MIGRATIONS} (id integer NOT NULL PRIMARY KEY autoincrement, ${this.COL_FILE_NAME} varchar(${AbstractClient.MAX_FILE_NAME_LENGTH}) UNIQUE, ${this.COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`

  constructor(migrationFolder: string, connectionOptions: string) {
    super(migrationFolder);
    this.clientOptions = connectionOptions;
  }

  async prepare(): Promise<void> {
    this.client = await open(this.clientOptions)
    const migrationTableExists = (await this.query(this.QUERY_MIGRATION_TABLE_EXISTS)).rows[0][0] === this.TABLE_MIGRATIONS;

    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE)
      console.info("Database setup complete");
    }
  }

  async query(query: string): Promise<any> {
    return [...this.client!.query(query, [])];
  }

  async close(): Promise<void> {
    await save(this.client!);
  }

  async migrate() {
    const latestMigration = await this.query(this.QUERY_GET_LATEST)
    await super.migrate(latestMigration[0]?.[0], this.query)
  }

  async rollback() {
    const allMigrations = await this.query(this.QUERY_GET_ALL)
    super.rollback(allMigrations[0], this.query)
  }
}
