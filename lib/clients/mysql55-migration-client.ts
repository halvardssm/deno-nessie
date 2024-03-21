import {
  MySqlMigrationClient,
  MySqlMigrationClientOptions,
} from "./mysql-migration-client.ts";

/** MySQL 5.5 client */
export class MySql55MigrationClient extends MySqlMigrationClient {
  constructor(
    options: MySqlMigrationClientOptions,
  ) {
    super({
      ...options,
      queries: {
        createMigrationTable: (ctx) =>
          `CREATE TABLE ${ctx.table} (${ctx.columnId} bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${ctx.columnFileName} varchar(${ctx.maxFileNameLength}) NOT NULL UNIQUE, ${ctx.columnCreatedAt} timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP);`,
        ...options.queries,
      },
    });
  }
}
