import {
  type ClientOptions,
  type Queryable,
  SqlClient,
} from "@stdext/database/sql";
import {
  type PostgresConnectionOptions,
  PostgresDriver,
  type PostgresTransactionOptions,
} from "./driver.ts";
import type { AppliedMigration, NessieClient } from "../../lib/types.ts";
import {
  CHECKSUM_TYPE,
  deleteApplied,
  FILE_NAME_TYPE,
  insertApplied,
  quotedNames,
  selectApplied,
  updateChecksum,
} from "../_migration_table.ts";

/**
 * The options of a {@linkcode PostgresClient}: the `@stdext/database` client
 * options, with the Postgres specific `connectionOptions` and
 * `transactionOptions`.
 */
export interface PostgresClientOptions
  extends
    ClientOptions<PostgresConnectionOptions, PostgresTransactionOptions> {}

/**
 * The Postgres client: the standard `@stdext/database` client with the
 * {@linkcode PostgresDriver}, which also implements {@linkcode NessieClient},
 * so nessie can keep its migration table in the database.
 *
 * The connection URL is a Postgres connection URI, e.g.
 * `postgres://user:password@localhost:5432/database`. Options of the
 * {@link https://github.com/porsager/postgres | postgres} library, such as
 * `ssl`, go in `connectionOptions.driverOptions`. Notes:
 *
 * - Parameters are `$1`, `$2` placeholders. Named parameters are not supported.
 * - Postgres has no insert ids, use `RETURNING` to get them.
 * - `BIGINT` is read as a `number` when it is a safe integer, and as a
 *   `bigint` otherwise.
 * - DDL statements are transactional, so a failing migration is rolled back
 *   completely.
 *
 * @example
 * ```ts ignore
 * import { PostgresClient } from "@halvardm/nessie/clients/postgres";
 *
 * await using client = new PostgresClient(
 *   "postgres://root:pwd@localhost:5432/nessie",
 *   { connectionOptions: { driverOptions: { ssl: "require" } } },
 * );
 * console.log(await client.query("SELECT 1 AS one").toRecords());
 * ```
 */
export class PostgresClient
  extends SqlClient<PostgresDriver, PostgresClientOptions>
  implements NessieClient {
  /**
   * Creates the client. It connects when it is first used.
   *
   * @param connectionUrl a Postgres connection URI
   * @param options the client options, e.g. `connectionOptions.driverOptions`
   * for the options of `postgres`, or `poolOptions.maxSize`
   */
  constructor(connectionUrl: string | URL, options?: PostgresClientOptions) {
    super(new PostgresDriver(), connectionUrl, options);
  }

  /**
   * Creates `nessie_migrations`, or adds the `checksum` column to the table
   * of an earlier version. {@linkcode NessieClient.createMigrationTable}
   */
  async createMigrationTable(db: Queryable): Promise<void> {
    const { table, file, checksum, created } = quotedNames(this.dialect);
    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${table} (id bigserial PRIMARY KEY, ${file} ${FILE_NAME_TYPE} NOT NULL UNIQUE, ${checksum} ${CHECKSUM_TYPE}, ${created} timestamp (0) NOT NULL DEFAULT current_timestamp)`,
    );
    // A table from before checksums existed
    await db.execute(
      `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${checksum} ${CHECKSUM_TYPE}`,
    );
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
