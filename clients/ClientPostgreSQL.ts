import type { ConnectionOptions } from "https://deno.land/x/postgres@v0.4.6/connection_params.ts";
import { Client } from "https://deno.land/x/postgres@v0.4.6/mod.ts";
import type { QueryResult } from "https://deno.land/x/postgres@v0.4.6/query.ts";
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

export type { ConnectionOptions };

/** PostgreSQL client */
export class ClientPostgreSQL extends AbstractClient<Client>
  implements ClientI {
  dialect: DBDialects = "pg";

  private QUERY_TRANSACTION_START = `BEGIN TRANSACTION;`;
  private QUERY_TRANSACTION_COMMIT = `COMMIT TRANSACTION;`;
  private QUERY_TRANSACTION_ROLLBACK = `ROLLBACK TRANSACTION;`;

  private QUERY_MIGRATION_TABLE_EXISTS =
    `SELECT to_regclass('${TABLE_MIGRATIONS}');`;

  private QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${TABLE_MIGRATIONS} (id bigserial PRIMARY KEY, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) UNIQUE, ${COL_CREATED_AT} timestamp (0) default current_timestamp);`;

  private QUERY_UPDATE_TIMESTAMPS =
    `UPDATE ${TABLE_MIGRATIONS} SET ${COL_FILE_NAME} = to_char(to_timestamp(CAST(SPLIT_PART(${COL_FILE_NAME}, '-', 1) AS BIGINT) / 1000), 'yyyymmddHH24MISS') || '-' || SPLIT_PART(${COL_FILE_NAME}, '-', 2) WHERE CAST(SPLIT_PART(${COL_FILE_NAME}, '-', 1) AS BIGINT) < 1672531200000;`;

  constructor(
    options: ClientOptions,
    connectionOptions: ConnectionOptions,
  ) {
    super({
      ...options,
      client: new Client(connectionOptions),
    });
  }

  async prepare() {
    await this.client.connect();

    const queryResult = await this.client.query(
      this.QUERY_MIGRATION_TABLE_EXISTS,
    ) as QueryResult;

    const migrationTableExists =
      queryResult.rows?.[0]?.[0] === TABLE_MIGRATIONS;

    if (!migrationTableExists) {
      await this.client.query(this.QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  async updateTimestamps() {
    await this.client.connect();
    const queryResult = await this.query(
      this.QUERY_MIGRATION_TABLE_EXISTS,
    ) as QueryResult;

    const migrationTableExists =
      queryResult.rows?.[0]?.[0] === TABLE_MIGRATIONS;

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
    try {
      if (typeof query === "string") {
        return await this.client.query(query);
      } else {
        return await this.client.multiQuery(query.map((el) => ({ text: el })));
      }
    } catch (e) {
      throw new Error("Error:" + query + "\n" + e);
    }
  }

  async close() {
    await this.client.end();
  }

  async migrate(amount: AmountMigrateT) {
    const latestMigration = await this.client.query(
      this.QUERY_GET_LATEST,
    ) as QueryResult;
    await super.migrate(
      amount,
      latestMigration.rows?.[0]?.[0],
      this.query.bind(this),
    );
  }

  async rollback(amount: AmountRollbackT) {
    const allMigrations = await this.client.query(
      this.QUERY_GET_ALL,
    ) as QueryResult;

    await super.rollback(
      amount,
      allMigrations.rows?.flatMap((el: any) => el?.[0]),
      this.query.bind(this),
    );
  }

  async seed(matcher?: string) {
    await super.seed(matcher, this.query.bind(this));
  }
}
