import { SQLiteClient } from "../deps.ts";
import { AbstractClient } from "./AbstractClient.ts";
import type {
  AmountMigrateT,
  AmountRollbackT,
  DBDialects,
  QueryT,
} from "../types.ts";
import {
  COL_CREATED_AT,
  COL_FILE_NAME,
  MAX_FILE_NAME_LENGTH,
  TABLE_MIGRATIONS,
} from "../consts.ts";
import { NessieError } from "../cli/errors.ts";

export type SQLiteClientOptions = string | undefined;

/** SQLite client */
export class ClientSQLite extends AbstractClient<SQLiteClient> {
  dialect: DBDialects = "sqlite";

  #QUERY_TRANSACTION_START = `BEGIN TRANSACTION;`;
  #QUERY_TRANSACTION_COMMIT = `COMMIT;`;
  #QUERY_TRANSACTION_ROLLBACK = `ROLLBACK;`;

  #QUERY_MIGRATION_TABLE_EXISTS =
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${TABLE_MIGRATIONS}';`;

  #QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${TABLE_MIGRATIONS} (id integer NOT NULL PRIMARY KEY autoincrement, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) UNIQUE, ${COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`;

  #QUERY_UPDATE_TIMESTAMPS =
    `UPDATE ${TABLE_MIGRATIONS} SET ${COL_FILE_NAME} = strftime('%Y%m%d%H%M%S', CAST(substr(${COL_FILE_NAME}, 0, instr(${COL_FILE_NAME}, '-')) AS INTEGER) / 1000, 'unixepoch') || substr(${COL_FILE_NAME}, instr(${COL_FILE_NAME}, '-')) WHERE CAST(substr(${COL_FILE_NAME}, 0, instr(${COL_FILE_NAME}, '-')) AS INTEGER) < 1672531200000;`;

  constructor(connectionOptions?: string) {
    super({ client: new SQLiteClient(connectionOptions) });
  }

  async prepare() {
    const queryResult = await this.query(this.#QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists =
      queryResult?.[0]?.[0]?.[0] === TABLE_MIGRATIONS;

    if (!migrationTableExists) {
      await this.query(this.#QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  async updateTimestamps() {
    const queryResult = await this.query(this.#QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists =
      queryResult?.[0]?.[0]?.[0] === TABLE_MIGRATIONS;

    if (migrationTableExists) {
      await this.query(this.#QUERY_TRANSACTION_START);
      try {
        await this.query(this.#QUERY_UPDATE_TIMESTAMPS);
        await this.query(this.#QUERY_TRANSACTION_COMMIT);
        console.info("Updated timestamps");
      } catch (e) {
        await this.query(this.#QUERY_TRANSACTION_ROLLBACK);
        throw e;
      }
    }
  }

  async query(query: QueryT) {
    if (typeof query === "string") query = this.splitAndTrimQueries(query);
    const ra = [];

    for await (const qs of query) {
      try {
        ra.push([...this.client!.query(qs)]);
      } catch (e) {
        if (e?.message === "Query was empty") {
          ra.push(undefined);
        } else {
          throw new NessieError(query + "\n" + e + "\n" + ra.join("\n"));
        }
      }
    }

    return ra;
  }

  // deno-lint-ignore require-await
  async close() {
    this.client?.close();
  }

  async migrate(amount: AmountMigrateT) {
    const latestMigration = await this.query(this.QUERY_GET_LATEST);
    await this._migrate(
      amount,
      latestMigration?.[0]?.[0]?.[0],
      this.query.bind(this),
    );
  }

  async rollback(amount: AmountRollbackT) {
    const allMigrations = await this.query(this.QUERY_GET_ALL);

    await this._rollback(
      amount,
      allMigrations?.[0]?.flatMap((el) => el?.[0]),
      this.query.bind(this),
    );
  }

  async seed(matcher?: string) {
    await this._seed(matcher);
  }
}
