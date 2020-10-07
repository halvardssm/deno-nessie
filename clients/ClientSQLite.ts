import { DB } from "https://deno.land/x/sqlite@v2.3.0/mod.ts";
import { AbstractClient } from "./AbstractClient.ts";
import { resolve } from "../deps.ts";
import type {
  AmountMigrateT,
  AmountRollbackT,
  ClientI,
  ClientOptions,
  DBDialects,
  QueryT,
} from "../types.ts";

/** SQLite client */
export class ClientSQLite extends AbstractClient<DB> implements ClientI {
  dialect: DBDialects = "sqlite3";

  private QUERY_MIGRATION_TABLE_EXISTS =
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${this.TABLE_MIGRATIONS}';`;
  private QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${this.TABLE_MIGRATIONS} (id integer NOT NULL PRIMARY KEY autoincrement, ${this.COL_FILE_NAME} varchar(${AbstractClient.MAX_FILE_NAME_LENGTH}) UNIQUE, ${this.COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`;

  constructor(options: ClientOptions, connectionOptions: string) {
    super({
      ...options,
      client: new DB(resolve(connectionOptions)),
    });
  }

  async prepare() {
    const queryResult = await this.query(this.QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists =
      queryResult?.[0]?.[0]?.[0] === this.TABLE_MIGRATIONS;

    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
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
          throw new Error(query + "\n" + e + "\n" + ra.join("\n"));
        }
      }
    }

    return ra;
  }

  async close() {
    this.client?.close();
  }

  async migrate(amount: AmountMigrateT) {
    const latestMigration = await this.query(this.QUERY_GET_LATEST);
    await super.migrate(
      amount,
      latestMigration?.[0]?.[0]?.[0],
      this.query.bind(this),
    );
  }

  async rollback(amount: AmountRollbackT) {
    const allMigrations = await this.query(this.QUERY_GET_ALL);

    await super.rollback(
      amount,
      allMigrations?.[0]?.flatMap((el) => el?.[0]),
      this.query.bind(this),
    );
  }

  async seed(matcher?: string) {
    await super.seed(matcher, this.query.bind(this));
  }
}
