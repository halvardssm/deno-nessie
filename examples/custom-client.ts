import { SqliteDriver } from "@stdext/database/drivers/sqlite";
import { type Queryable, SqlClient } from "@stdext/database/sql";
import type { AppliedMigration, NessieClient, NessieConfig } from "../mod.ts";

/**
 * A client is an `@stdext/database` client which also keeps the table of
 * applied migrations. Nessie has no SQL of its own, so everything about the
 * table is decided here: this one stores the migrations in `schema_history`
 * instead of `nessie_migrations`.
 *
 * `db` is the connection, or transaction, that nessie runs the migration on.
 * Use it, and not `this`, so the record is committed with the migration.
 */
class HistoryClient extends SqlClient<SqliteDriver> implements NessieClient {
  constructor(url: string) {
    super(new SqliteDriver(), url);
  }

  async createMigrationTable(db: Queryable): Promise<void> {
    // Called before every command, so it must be safe to repeat. Bring tables
    // from older versions of your own schema up to date here too.
    await db.execute(
      `CREATE TABLE IF NOT EXISTS schema_history (
         name TEXT NOT NULL PRIMARY KEY,
         checksum TEXT,
         applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
       )`,
    );
  }

  async getAppliedMigrations(db: Queryable): Promise<AppliedMigration[]> {
    const rows = await db.query(
      "SELECT name, checksum FROM schema_history ORDER BY name DESC",
    ).toRecords();
    return rows.map((row) => ({
      name: String(row.name),
      checksum: row.checksum === null ? null : String(row.checksum),
    }));
  }

  async addMigration(
    db: Queryable,
    name: string,
    checksum: string,
  ): Promise<void> {
    await db.execute(
      "INSERT INTO schema_history (name, checksum) VALUES (?, ?)",
      [name, checksum],
    );
  }

  async removeMigration(db: Queryable, name: string): Promise<void> {
    await db.execute("DELETE FROM schema_history WHERE name = ?", [name]);
  }

  async setChecksum(
    db: Queryable,
    name: string,
    checksum: string,
  ): Promise<void> {
    await db.execute("UPDATE schema_history SET checksum = ? WHERE name = ?", [
      checksum,
      name,
    ]);
  }
}

const config: NessieConfig = { client: new HistoryClient("./history.db") };

export default config;
