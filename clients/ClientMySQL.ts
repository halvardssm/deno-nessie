import { MySQLClient } from "../deps.ts";
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

export type MySQLClientOptions = Parameters<MySQLClient["connect"]>;

/**
 * MySQL client
 *
 * This is for MySQL versions >5.5, if you want to use version <=5.5,
 * use ClientMySQL55 instead.
 */
export class ClientMySQL extends AbstractClient<MySQLClient> {
  protected clientOptions: MySQLClientOptions;
  dialect: DBDialects = "mysql";

  protected get QUERY_TRANSACTION_START() {
    return `START TRANSACTION;`;
  }

  protected get QUERY_TRANSACTION_COMMIT() {
    return `COMMIT;`;
  }

  protected get QUERY_TRANSACTION_ROLLBACK() {
    return `ROLLBACK;`;
  }

  protected get QUERY_MIGRATION_TABLE_EXISTS() {
    return `SELECT * FROM information_schema.tables WHERE table_name = '${TABLE_MIGRATIONS}' LIMIT 1;`;
  }

  protected get QUERY_CREATE_MIGRATION_TABLE() {
    return `CREATE TABLE ${TABLE_MIGRATIONS} (id bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) NOT NULL UNIQUE, ${COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`;
  }

  protected get QUERY_UPDATE_TIMESTAMPS() {
    return `UPDATE ${TABLE_MIGRATIONS} SET ${COL_FILE_NAME} = CONCAT(FROM_UNIXTIME(CAST(substring_index(${COL_FILE_NAME}, '-', 1) AS SIGNED) / 1000, '%Y%m%d%H%i%S'), substring(file_name, instr( file_name,'-'))) WHERE CAST(substring_index(${COL_FILE_NAME}, '-', 1) AS SIGNED) < 1672531200000;`;
  }

  constructor(...connectionOptions: MySQLClientOptions) {
    super({ client: new MySQLClient() });
    this.clientOptions = connectionOptions;
  }

  async prepare() {
    await this.client.connect(...this.clientOptions);
    const queryResult = await this.query(this.QUERY_MIGRATION_TABLE_EXISTS);

    const migrationTableExists = queryResult?.[0]?.length > 0;

    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE);
      console.info("Database setup complete");
    }
  }

  async updateTimestamps() {
    await this.client.connect(...this.clientOptions);
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
          throw new NessieError(query + "\n" + e + "\n" + ra.join("\n"));
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
    await this._migrate(
      amount,
      latestMigration?.[0]?.[0]?.[COL_FILE_NAME],
      this.query.bind(this),
    );
  }

  async rollback(amount: AmountRollbackT) {
    const allMigrations = await this.getAll();

    await this._rollback(
      amount,
      allMigrations,
      this.query.bind(this),
    );
  }

  async seed(matcher?: string) {
    await this._seed(matcher);
  }

  async getAll() {
    const allMigrations = await this.query(this.QUERY_GET_ALL);

    const parsedMigrations: string[] = allMigrations?.[0]
      .map((el: Record<string, string>) => el?.[COL_FILE_NAME]);

    return parsedMigrations;
  }
}
