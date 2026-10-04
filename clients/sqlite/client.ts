import {
  type SqliteClientOptions,
  SqliteDriver,
} from "@stdx/database/drivers/sqlite";
import { type Queryable, SqlClient } from "@stdx/database/sql";
import type { AppliedMigration, NessieClient } from "../../lib/types.ts";
import {
  CHECKSUM_TYPE,
  COL_CHECKSUM,
  deleteApplied,
  FILE_NAME_TYPE,
  insertApplied,
  quotedNames,
  selectApplied,
  TABLE,
  updateChecksum,
} from "../_migration_table.ts";

/**
 * The SQLite client: the `SqliteClient` of `@stdx/database`, which also
 * implements {@linkcode NessieClient}, so nessie can keep its migration table
 * in the database. It replaces the client of `@stdx/database` for nessie, as
 * that one does not implement the interface.
 *
 * The connection URL is a file path, a `file:` URL or `:memory:`. SQLite takes
 * one connection, so migrations and seeds run one at a time. An in-memory
 * database is gone when the client is closed, which makes it useful in tests,
 * but not for a CLI config. Parameters are `?` placeholders, or `:name` for
 * named parameters. Options are those of the `@stdx/database` client.
 *
 * @example
 * ```ts
 * import { SqliteClient } from "@halvardm/nessie/clients/sqlite";
 * import { assertEquals } from "@std/assert";
 *
 * await using client = new SqliteClient(":memory:");
 * await client.execute("CREATE TABLE users (id INTEGER, name TEXT)");
 * await client.execute("INSERT INTO users VALUES (?, ?)", [1, "Alice"]);
 *
 * assertEquals(await client.query("SELECT * FROM users").toRecords(), [
 *   { id: 1, name: "Alice" },
 * ]);
 * ```
 */
export class SqliteClient extends SqlClient<SqliteDriver, SqliteClientOptions>
  implements NessieClient {
  /**
   * Creates the client. It connects when it is first used.
   *
   * @param connectionUrl a file path, a `file:` URL or `:memory:`
   * @param options the `@stdx/database` client options, such as
   * `connectionOptions: { readOnly: true }`
   */
  constructor(connectionUrl: string | URL, options?: SqliteClientOptions) {
    super(new SqliteDriver(), connectionUrl, options);
  }

  /**
   * Creates `nessie_migrations`, or adds the `checksum` column to the table
   * of an earlier version. {@linkcode NessieClient.createMigrationTable}
   */
  async createMigrationTable(db: Queryable): Promise<void> {
    const { table, file, checksum, created } = quotedNames(this.dialect);
    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${table} (id integer NOT NULL PRIMARY KEY autoincrement, ${file} ${FILE_NAME_TYPE} NOT NULL UNIQUE, ${checksum} ${CHECKSUM_TYPE}, ${created} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );

    // A table from before checksums existed
    const columns = await db.query(
      "SELECT 1 FROM pragma_table_info(?) WHERE name = ?",
      [TABLE, COL_CHECKSUM],
    ).toValues();
    if (columns.length === 0) {
      await db.execute(
        `ALTER TABLE ${table} ADD COLUMN ${checksum} ${CHECKSUM_TYPE}`,
      );
    }
  }

  /** {@linkcode NessieClient.getAppliedMigrations} */
  getAppliedMigrations(db: Queryable): Promise<AppliedMigration[]> {
    return selectApplied(db, this.dialect);
  }

  /** {@linkcode NessieClient.addMigration} */
  addMigration(db: Queryable, name: string, checksum: string): Promise<void> {
    return insertApplied(db, this.dialect, name, checksum);
  }

  /** {@linkcode NessieClient.removeMigration} */
  removeMigration(db: Queryable, name: string): Promise<void> {
    return deleteApplied(db, this.dialect, name);
  }

  /** {@linkcode NessieClient.setChecksum} */
  setChecksum(db: Queryable, name: string, checksum: string): Promise<void> {
    return updateChecksum(db, this.dialect, name, checksum);
  }
}
