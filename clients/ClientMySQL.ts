import { Client, ClientConfig } from "https://deno.land/x/mysql@v2.8.0/mod.ts";
import { AbstractClient } from "./AbstractClient.ts";
import type {
  AmountMigrateT,
  AmountRollbackT,
  ClientI,
  ClientOptions,
  DBDialects,
  QueryT,
} from "../types.ts";
import {
  COL_CREATED_AT,
  COL_FILE_NAME,
  MAX_FILE_NAME_LENGTH,
  TABLE_MIGRATIONS,
} from "../consts.ts";

/** MySQL client */
export class ClientMySQL extends AbstractClient<Client> implements ClientI {
  private clientOptions: ClientConfig;
  dialect: DBDialects = "mysql";

  private QUERY_TRANSACTION_START = `START TRANSACTION;`;
  private QUERY_TRANSACTION_COMMIT = `COMMIT;`;
  private QUERY_TRANSACTION_ROLLBACK = `ROLLBACK;`;

  private QUERY_MIGRATION_TABLE_EXISTS =
    `SELECT * FROM information_schema.tables WHERE table_name = '${TABLE_MIGRATIONS}' LIMIT 1;`;

  private QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${TABLE_MIGRATIONS} (id bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) NOT NULL UNIQUE, ${COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`;

  private QUERY_UPDATE_TIMESTAMPS =
    `UPDATE ${TABLE_MIGRATIONS} SET ${COL_FILE_NAME} = CONCAT(FROM_UNIXTIME(CAST(substring_index(${COL_FILE_NAME}, '-', 1) AS SIGNED) / 1000, '%Y%m%d%H%i%S'), substring(file_name, instr( file_name,'-'))) WHERE CAST(substring_index(${COL_FILE_NAME}, '-', 1) AS SIGNED) < 1672531200000;`;

  constructor(
    options: ClientOptions,
    connectionOptions: ClientConfig,
  ) {
    super({
      ...options,
      client: new Client(),
    });
    this.clientOptions = connectionOptions;
  }

  async prepare() {
    await this.client.connect(this.clientOptions);
    const queryResult = await this.query(this.QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists = queryResult?.[0]?.length > 0;

    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  async updateTimestamps() {
    await this.client.connect(this.clientOptions);
    const queryResult = await this.query(this.QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists = queryResult?.[0]?.length > 0;

    if (migrationTableExists) {
      await this.query(this.QUERY_TRANSACTION_START);
      try {
        await this.query(this.QUERY_UPDATE_TIMESTAMPS);
        await this.query(this.QUERY_TRANSACTION_COMMIT);
        console.info("Updated timestamps");
      } catch (e) {
        await this.query(this.QUERY_TRANSACTION_ROLLBACK);
        throw e;
      }
    }
  }

  async query(query: QueryT) {
    if (typeof query === "string") query = this.splitAndTrimQueries(query);
    const ra = [];

    for await (const qs of query) {
      try {
        if (
          qs.trim().toLowerCase().startsWith("select") ||
          qs.trim().toLowerCase().startsWith("show")
        ) {
          ra.push(await this.client.query(qs));
        } else {
          ra.push(await this.client.execute(qs));
        }
      } catch (e) {
        if (e?.message === "Query was empty") {
          ra.push(undefined);
        } else {
          throw new Error(query + "\n" + e + "\n" + ra.join("\n"));
        }
      }
    }

    return ra;
  }

  async close() {
    await this.client.close();
  }

  async migrate(amount: AmountMigrateT) {
    const latestMigration = await this.query(this.QUERY_GET_LATEST);
    await super.migrate(
      amount,
      latestMigration?.[0]?.[0]?.[COL_FILE_NAME],
      this.query.bind(this),
    );
  }

  async rollback(amount: AmountRollbackT) {
    const allMigrations = await this.query(this.QUERY_GET_ALL);

    const parsedMigrations: string[] = allMigrations?.[0].map((el: any) =>
      el?.[COL_FILE_NAME]
    );

    await super.rollback(
      amount,
      parsedMigrations,
      this.query.bind(this),
    );
  }

  async seed(matcher?: string) {
    await super.seed(matcher, this.query.bind(this));
  }
}
