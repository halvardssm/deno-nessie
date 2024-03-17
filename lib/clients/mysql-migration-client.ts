import {
  AbstractMigrationClient,
  COL_CREATED_AT,
  COL_FILE_NAME,
  DbDialects,
  MAX_FILE_NAME_LENGTH,
  TABLE_MIGRATIONS,
} from "../mod.ts";
import { MySqlConnection, MySqlConnectionOptions } from "@db/sqlx";

/**
 * MySQL client
 *
 * This is for MySQL versions >5.5, if you want to use version <=5.5,
 * use ClientMySQL55 instead.
 */
export class MySqlMigrationClient
  extends AbstractMigrationClient<MySqlConnection> {
  readonly QUERY_MIGRATION_TABLE_EXISTS: string =
    `SELECT * FROM information_schema.tables WHERE table_name = '${TABLE_MIGRATIONS}' LIMIT 1;`;
  readonly QUERY_CREATE_MIGRATION_TABLE: string =
    `CREATE TABLE ${TABLE_MIGRATIONS} (id bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) NOT NULL UNIQUE, ${COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`;

  constructor(
    connectionUrl: string,
    connectionOptions: MySqlConnectionOptions = {},
  ) {
    super({
      dialect: DbDialects.MySql,
      client: new MySqlConnection(connectionUrl, connectionOptions),
    });
  }
}
