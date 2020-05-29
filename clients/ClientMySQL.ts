import { Client, ClientConfig } from "https://deno.land/x/mysql@2.0.0/mod.ts";
import { AbstractClient, ClientI } from "./AbstractClient.ts";

export class ClientMySQL extends AbstractClient implements ClientI {
  private client: Client;
  private clientOptions: ClientConfig;

  private QUERY_MIGRATION_TABLE_EXISTS =
    `show tables like '${this.TABLE_MIGRATIONS}';`;
  private QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${this.TABLE_MIGRATIONS} (id bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${this.COL_FILE_NAME} varchar(${AbstractClient.MAX_FILE_NAME_LENGTH}) NOT NULL UNIQUE, ${this.COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`;

  constructor(migrationFolder: string, connectionOptions: ClientConfig) {
    super(migrationFolder);
    this.clientOptions = connectionOptions;
    this.client = new Client();
  }

  async prepare(): Promise<void> {
    await this.client.connect(this.clientOptions);
    const migrationTableExists =
      (await this.query(this.QUERY_MIGRATION_TABLE_EXISTS)).length > 0;
    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  async query(query: string): Promise<any> {
    return await this.client.query(query);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async migrate() {
    const latestMigration = await this.query(this.QUERY_GET_LATEST);
    await super.migrate(latestMigration[0]?.[this.COL_FILE_NAME], this.query);
  }

  async rollback() {
    const allMigrations = await this.query(this.QUERY_GET_ALL);
    super.rollback(allMigrations.rows?.[0], this.query);
  }
}
