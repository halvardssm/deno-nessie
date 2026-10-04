/**
 * SQLite client for nessie, see
 * {@link https://jsr.io/@stdext/database | @stdext/database}.
 *
 * @module
 */
export * from "@stdext/database/drivers/sqlite";
// Replaces the plain client of `@stdext/database` with one which also
// implements the nessie client interface.
export { SqliteClient } from "./sqlite/client.ts";
