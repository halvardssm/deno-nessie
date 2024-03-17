import {
  AbstractMigrationClient,
  COL_CREATED_AT,
  COL_FILE_NAME,
  DbDialects,
  MAX_FILE_NAME_LENGTH,
  TABLE_MIGRATIONS,
} from "../mod.ts";
import { PostgresConnection, PostgresConnectionOptions } from "@db/sqlx";

/** PostgreSQL client */
export class PostgresMigrationClient
  extends AbstractMigrationClient<PostgresConnection> {
  readonly QUERY_MIGRATION_TABLE_EXISTS: string =
    `SELECT * FROM information_schema.tables WHERE table_name = '${TABLE_MIGRATIONS}' LIMIT 1;`;
  readonly QUERY_CREATE_MIGRATION_TABLE: string =
    `CREATE TABLE ${TABLE_MIGRATIONS} (id bigserial PRIMARY KEY, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) UNIQUE, ${COL_CREATED_AT} timestamp (0) default current_timestamp);`;

  constructor(
    connectionUrl: string,
    connectionOptions: PostgresConnectionOptions = {},
  ) {
    super({
      dialect: DbDialects.Postgres,
      client: new PostgresConnection(connectionUrl, connectionOptions),
    });
  }
}
