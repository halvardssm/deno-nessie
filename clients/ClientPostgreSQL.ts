import { ConnectionOptions } from "https://deno.land/x/postgres@v0.4.0/connection_params.ts";
import { Client } from "https://deno.land/x/postgres@v0.4.0/mod.ts";
import { QueryResult } from "https://deno.land/x/postgres@v0.4.0/query.ts";
import { AbstractClient, ClientI } from "./AbstractClient.ts";

export class ClientPostgreSQL extends AbstractClient implements ClientI {
  private client: Client;

  private QUERY_MIGRATION_TABLE_EXISTS =
    `SELECT to_regclass('${this.TABLE_MIGRATIONS}');`;

  private QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${this.TABLE_MIGRATIONS} (id bigserial PRIMARY KEY, ${this.COL_FILE_NAME} varchar(${AbstractClient.MAX_FILE_NAME_LENGTH}) UNIQUE, ${this.COL_CREATED_AT} timestamp (0) default current_timestamp);`;

  constructor(migrationFolder: string, connectionOptions: ConnectionOptions) {
    super(migrationFolder);
    this.client = new Client(connectionOptions);
  }

  async prepare(): Promise<void> {
    await this.client.connect();

    const queryResult = await this.query(this.QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists =
      queryResult.rows?.[0]?.[0] === this.TABLE_MIGRATIONS;

    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  async query(query: string): Promise<QueryResult> {
    try {
      return await this.client.query(query);
    } catch (e) {
      throw new Error(query + "\n" +e);
    }
  }

  async close(): Promise<void> {
    await this.client.end();
  }

  async migrate(amount: number | undefined) {
    const latestMigration = await this.query(this.QUERY_GET_LATEST);
    await super.migrate(
      amount,
      latestMigration.rows?.[0]?.[0],
      this.query.bind(this),
    );
  }

  async rollback(amount: number | undefined) {
    const allMigrations = await this.query(this.QUERY_GET_ALL);
    await super.rollback(
      amount,
      allMigrations.rows?.[0],
      this.query.bind(this),
    );
  }
}
