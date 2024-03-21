import { InheritedMigrationClientOptions, MigrationClient } from "../mod.ts";
import { SqLiteConnection } from "@db/sqlx";

export type SqLiteMigrationClientOptions = InheritedMigrationClientOptions<
  typeof SqLiteConnection
>;

/** SQLite client */
export class SqLiteMigrationClient
  extends MigrationClient<typeof SqLiteConnection> {
  constructor(options: SqLiteMigrationClientOptions) {
    super({
      dialect: "sqlite",
      client: Array.isArray(options.client)
        ? new SqLiteConnection(...options.client)
        : options.client,
      queries: {
        migrationTableExists: (ctx) =>
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${ctx.table}';`,
        createMigrationTable: (ctx) =>
          `CREATE TABLE ${ctx.table} (${ctx.columnId} integer NOT NULL PRIMARY KEY autoincrement, ${ctx.columnFileName} varchar(${ctx.maxFileNameLength}) UNIQUE, ${ctx.columnCreatedAt} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`,
        ...options.queries,
      },
    });
  }
}
