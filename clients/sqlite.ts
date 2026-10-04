/**
 * SQLite client for nessie, see
 * {@link https://jsr.io/@stdx/database | @stdx/database}.
 *
 * @module
 */
export * from "@stdx/database/drivers/sqlite";
// Replaces the plain client of `@stdx/database` with one which also
// implements the nessie client interface.
export { SqliteClient } from "./sqlite/client.ts";
