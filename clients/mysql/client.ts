import {
  type ClientOptions,
  type Queryable,
  SqlClient,
} from "@stdext/database/sql";
import {
  type MysqlConnectionOptions,
  MysqlDriver,
  type MysqlTransactionOptions,
} from "./driver.ts";
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
 * The options of a {@linkcode MysqlClient}: the `@stdext/database` client
 * options, with the MySQL specific `connectionOptions` and
 * `transactionOptions`.
 */
export interface MysqlClientOptions
  extends ClientOptions<MysqlConnectionOptions, MysqlTransactionOptions> {}

/**
 * The MySQL client: the standard `@stdext/database` client with the
 * {@linkcode MysqlDriver}, which also implements {@linkcode NessieClient}, so
 * nessie can keep its migration table in the database. It works with MariaDB
 * too.
 *
 * The connection URL is a MySQL connection URI, e.g.
 * `mysql://user:password@localhost:3306/database`. Options of the
 * {@link https://sidorares.github.io/node-mysql2 | mysql2} library, such as
 * `ssl`, or `authPlugins` for older servers, go in
 * `connectionOptions.driverOptions`. Notes:
 *
 * - Parameters are `?` placeholders. Named parameters are not supported.
 * - **MySQL commits DDL statements implicitly.** A migration which changes the
 *   schema can not be rolled back by its transaction, so a failing migration
 *   may be left half applied.
 * - `execute` and `query` do not reject multiple statements, because
 *   `executeScript` has to be able to run them.
 * - `BIGINT` is read as a `number` when it is a safe integer, and as a
 *   `bigint` otherwise.
 * - Stopping a result early cancels the query on the server, instead of
 *   receiving the rows nobody reads.
 *
 * @example
 * ```ts ignore
 * import { MysqlClient } from "@halvardm/nessie/clients/mysql";
 *
 * await using client = new MysqlClient("mysql://root:pwd@localhost:3306/nessie");
 * console.log(await client.query("SELECT 1 AS one").toRecords());
 * ```
 */
export class MysqlClient extends SqlClient<MysqlDriver, MysqlClientOptions>
  implements NessieClient {
  /**
   * Creates the client. It connects when it is first used.
   *
   * @param connectionUrl a MySQL connection URI
   * @param options the client options, e.g. `connectionOptions.driverOptions`
   * for the options of `mysql2`, or `poolOptions.maxSize`
   */
  constructor(connectionUrl: string | URL, options?: MysqlClientOptions) {
    super(new MysqlDriver(), connectionUrl, options);
  }

  /**
   * Creates `nessie_migrations`, or adds the `checksum` column to the table
   * of an earlier version. MySQL has no `ADD COLUMN IF NOT EXISTS`, so the
   * column is looked up in `information_schema` first.
   * {@linkcode NessieClient.createMigrationTable}
   */
  async createMigrationTable(db: Queryable): Promise<void> {
    const { table, file, checksum, created } = quotedNames(this.dialect);
    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${table} (id bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${file} ${FILE_NAME_TYPE} NOT NULL UNIQUE, ${checksum} ${CHECKSUM_TYPE}, ${created} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    );

    // A table from before checksums existed. MySQL has no `IF NOT EXISTS`
    // for columns, so look in the catalog.
    const columns = await db.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
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
