import { ConnectionOptions } from "https://deno.land/x/postgres@v0.4.0/connection_params.ts";
import { Client } from "https://deno.land/x/postgres@v0.4.0/mod.ts";
import { QueryResult } from "https://deno.land/x/postgres@v0.4.0/query.ts";
import { AbstractClient, ClientI } from './AbstractClient.ts';

export class ClientPostgreSQL extends AbstractClient implements ClientI {
  private client: Client

  private QUERY_MIGRATION_TABLE_EXISTS = `SELECT to_regclass(${this.TABLE_MIGRATIONS});`

  private QUERY_CREATE_MIGRATION_TABLE = `CREATE TABLE ${this.TABLE_MIGRATIONS} (id bigserial PRIMARY KEY, ${this.COL_FILE_NAME} varchar(${AbstractClient.MAX_FILE_NAME_LENGTH}) UNIQUE, ${this.COL_CREATED_AT} timestamp (0) default current_timestamp);`

  constructor(migrationFolder: string, connectionOptions: ConnectionOptions) {
    super(migrationFolder);
    this.client = new Client(connectionOptions)
  }

  async prepare(): Promise<void> {
    await this.client.connect()
    const migrationTableExists = (await this.query(this.QUERY_MIGRATION_TABLE_EXISTS)).rows[0][0] === this.TABLE_MIGRATIONS;

    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE)
      console.info("Database setup complete");
    }
  }

  async query(query: string): Promise<QueryResult> {
    return await this.client.query(query);
  }

  async close(): Promise<void> {
    await this.client.end();
  }

  async migrate() {
    const latestMigration = await this.query(this.QUERY_GET_LATEST)
    await super.migrate(latestMigration.rows?.[0]?.[0], this.query)
  }

  async rollback() {
    const allMigrations = await this.query(this.QUERY_GET_ALL)
    super.rollback(allMigrations.rows?.[0], this.query)
  }
}
