import {
  AbstractMigrationClient,
  COL_CREATED_AT,
  COL_FILE_NAME,
  DbDialects,
  MAX_FILE_NAME_LENGTH,
  TABLE_MIGRATIONS,
} from "../mod.ts";
import { SqLiteConnection, SqLiteConnectionOptions } from "@db/sqlx";

/** SQLite client */
export class SqLiteMigrationClient
  extends AbstractMigrationClient<SqLiteConnection> {
  readonly QUERY_MIGRATION_TABLE_EXISTS: string =
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${TABLE_MIGRATIONS}';`;
  readonly QUERY_CREATE_MIGRATION_TABLE: string =
    `CREATE TABLE ${TABLE_MIGRATIONS} (id integer NOT NULL PRIMARY KEY autoincrement, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) UNIQUE, ${COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`;

  constructor(
    connectionUrl: string,
    connectionOptions: SqLiteConnectionOptions = {},
  ) {
    super({
      dialect: DbDialects.SqLite,
      client: new SqLiteConnection(connectionUrl, connectionOptions),
    });
  }
}
