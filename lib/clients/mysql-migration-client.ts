import { InheritedMigrationClientOptions, MigrationClient } from "../mod.ts";
import { MySqlConnection } from "@db/sqlx";

export type MySqlMigrationClientOptions = InheritedMigrationClientOptions<
  typeof MySqlConnection
>;

/**
 * MySQL client
 *
 * This is for MySQL versions >5.5, if you want to use version <=5.5,
 * use ClientMySQL55 instead.
 */
export class MySqlMigrationClient
  extends MigrationClient<typeof MySqlConnection> {
  constructor(options: MySqlMigrationClientOptions) {
    super({
      dialect: "mysql",
      client: Array.isArray(options.client)
        ? new MySqlConnection(...options.client)
        : options.client,
      queries: {
        migrationTableExists: (ctx) =>
          `SELECT * FROM information_schema.tables WHERE table_name = '${ctx.table}' LIMIT 1;`,
        createMigrationTable: (ctx) =>
          `CREATE TABLE ${ctx.table} (${ctx.columnId} bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${ctx.columnFileName} varchar(${ctx.maxFileNameLength}) NOT NULL UNIQUE, ${ctx.columnCreatedAt} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`,
        ...options.queries,
      },
    });
  }
}
