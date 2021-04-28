import {
  Client,
  ConnectionOptions,
} from "https://deno.land/x/postgres@0.11.2/mod.ts";
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

  #QUERY_TRANSACTION_START = `BEGIN TRANSACTION;`;
  #QUERY_TRANSACTION_COMMIT = `COMMIT TRANSACTION;`;
  #QUERY_TRANSACTION_ROLLBACK = `ROLLBACK TRANSACTION;`;

  #QUERY_MIGRATION_TABLE_EXISTS = `SELECT to_regclass('${TABLE_MIGRATIONS}');`;

  #QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${TABLE_MIGRATIONS} (id bigserial PRIMARY KEY, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) UNIQUE, ${COL_CREATED_AT} timestamp (0) default current_timestamp);`;

  #QUERY_UPDATE_TIMESTAMPS =
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

    const queryResult = await this.client
      .queryArray(this.#QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists =
      queryResult.rows?.[0]?.[0] === TABLE_MIGRATIONS;

    if (!migrationTableExists) {
      await this.client.queryArray(this.#QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  async updateTimestamps() {
    await this.client.connect();
    const queryResult = await this.client.queryArray(
      this.#QUERY_MIGRATION_TABLE_EXISTS,
    );

    const migrationTableExists =
      queryResult.rows?.[0]?.[0] === TABLE_MIGRATIONS;

    if (migrationTableExists) {
      await this.client.queryArray(this.#QUERY_TRANSACTION_START);
      try {
        await this.client.queryArray(this.#QUERY_UPDATE_TIMESTAMPS);
        await this.client.queryArray(this.#QUERY_TRANSACTION_COMMIT);
        console.info("Updated timestamps");
      } catch (e) {
        await this.client.queryArray(this.#QUERY_TRANSACTION_ROLLBACK);
        throw e;
      }
    }
  }

  async query(query: QueryT) {
    if (typeof query === "string") query = this.splitAndTrimQueries(query);
    const ra = [];

    for await (const qs of query) {
      try {
        ra.push(await this.client.queryArray(qs));
      } catch (e) {
        throw new Error(query + "\n" + e + "\n" + ra.join("\n"));
      }
    }

    return ra;
  }

  async close() {
    await this.client.end();
  }

  async migrate(amount: AmountMigrateT) {
    const latestMigration = await this.client.queryArray(this.QUERY_GET_LATEST);
    await super.migrate(
      amount,
      latestMigration.rows?.[0]?.[0] as undefined,
      this.query.bind(this),
    );
  }

  async rollback(amount: AmountRollbackT) {
    const allMigrations = await this.client.queryArray(this.QUERY_GET_ALL);

    await super.rollback(
      amount,
      allMigrations.rows?.map((el) => el?.[0]) as string[],
      this.query.bind(this),
    );
  }

  async seed(matcher?: string) {
    await super.seed(matcher, this.query.bind(this));
  }
}
