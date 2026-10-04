import type { Dialect, Queryable } from "@stdx/database/sql";
import { MAX_FILE_NAME_LENGTH } from "../lib/consts.ts";
import type { AppliedMigration } from "../lib/types.ts";

/**
 * The migration table, as used by the clients. These are the statements which
 * are the same for every database, written with the dialect of the client, and
 * the names of the table and its columns. Creating the table is database
 * specific, so every client does that itself.
 *
 * This is for the clients in this package, and is not exported from it.
 * Write the statements you need if you make a {@linkcode NessieClient}.
 *
 * @module
 */

/** The table where applied migrations are stored: `nessie_migrations` */
export const TABLE = "nessie_migrations";
/** The column holding the migration file name */
export const COL_FILE_NAME = "file_name";
/** The column holding the checksum of the migration file when it was applied */
export const COL_CHECKSUM = "checksum";
/** The column holding the time a migration was applied */
export const COL_CREATED_AT = "created_at";
/** The type of the file name and checksum columns */
export const FILE_NAME_TYPE = `varchar(${MAX_FILE_NAME_LENGTH})`;
/** The type of the checksum column: a SHA-256 as hex */
export const CHECKSUM_TYPE = "varchar(64)";

/**
 * The quoted names of the table and its columns, for the statements of the
 * clients.
 *
 * @param dialect the dialect to quote the identifiers with
 */
export function quotedNames(dialect: Dialect): {
  table: string;
  file: string;
  checksum: string;
  created: string;
} {
  const { quoteIdentifier } = dialect;
  return {
    table: quoteIdentifier(TABLE),
    file: quoteIdentifier(COL_FILE_NAME),
    checksum: quoteIdentifier(COL_CHECKSUM),
    created: quoteIdentifier(COL_CREATED_AT),
  };
}

/**
 * Reads the applied migrations.
 *
 * @param db the connection to read with
 * @param dialect the dialect of the database
 * @returns the migrations, ordered by name, newest first
 */
export async function selectApplied(
  db: Queryable,
  dialect: Dialect,
): Promise<AppliedMigration[]> {
  const { table, file, checksum } = quotedNames(dialect);
  const rows = await db.query(
    `SELECT ${file}, ${checksum} FROM ${table} ORDER BY ${file} DESC`,
  ).toValues();
  return rows.map(([name, checksum]) => ({
    name: String(name),
    checksum: checksum === null || checksum === undefined
      ? null
      : String(checksum),
  }));
}

/**
 * Records an applied migration.
 *
 * @param db the connection or transaction to write with
 * @param dialect the dialect of the database
 * @param name the file name of the migration
 * @param checksum the SHA-256 of the file, as hex
 */
export async function insertApplied(
  db: Queryable,
  dialect: Dialect,
  name: string,
  checksum: string,
): Promise<void> {
  const q = quotedNames(dialect);
  await db.execute(
    `INSERT INTO ${q.table} (${q.file}, ${q.checksum}) VALUES (${
      dialect.placeholder(0)
    }, ${dialect.placeholder(1)})`,
    [name, checksum],
  );
}

/**
 * Removes the record of an applied migration.
 *
 * @param db the connection or transaction to write with
 * @param dialect the dialect of the database
 * @param name the file name of the migration
 */
export async function deleteApplied(
  db: Queryable,
  dialect: Dialect,
  name: string,
): Promise<void> {
  const { table, file } = quotedNames(dialect);
  await db.execute(
    `DELETE FROM ${table} WHERE ${file} = ${dialect.placeholder(0)}`,
    [name],
  );
}

/**
 * Sets the checksum of an applied migration.
 *
 * @param db the connection to write with
 * @param dialect the dialect of the database
 * @param name the file name of the migration
 * @param checksum the SHA-256 of the file, as hex
 */
export async function updateChecksum(
  db: Queryable,
  dialect: Dialect,
  name: string,
  checksum: string,
): Promise<void> {
  const q = quotedNames(dialect);
  await db.execute(
    `UPDATE ${q.table} SET ${q.checksum} = ${
      dialect.placeholder(0)
    } WHERE ${q.file} = ${dialect.placeholder(1)}`,
    [checksum, name],
  );
}
