/**
 * Nessie, a database migration tool for Deno, built on
 * {@link https://jsr.io/@stdx/database | @stdx/database}.
 *
 * Migrations are files with an `up` and a `down`, run in the order of their
 * names, and recorded in the database. They run from the command line (see
 * `@halvardm/nessie/cli`), or from code with {@linkcode MigrationClient}.
 *
 * - Write the migrations and seeds: {@linkcode Migration}, {@linkcode Seed}.
 * - Configure the client and the folders: {@linkcode NessieConfig}.
 * - Run them from code: {@linkcode MigrationClient}.
 * - Support another database: {@linkcode NessieClient}.
 *
 * The clients for SQLite, Postgres and MySQL are in
 * `@halvardm/nessie/clients/sqlite`, `@halvardm/nessie/clients/postgres` and
 * `@halvardm/nessie/clients/mysql`.
 *
 * @example A config file, `nessie.config.ts`
 * ```ts ignore
 * import type { NessieConfig } from "@halvardm/nessie";
 * import { SqliteClient } from "@halvardm/nessie/clients/sqlite";
 *
 * const config: NessieConfig = { client: new SqliteClient("./sqlite.db") };
 *
 * export default config;
 * ```
 *
 * @example A migration, `db/migrations/20240101120000_create_users.ts`
 * ```ts ignore
 * import type { Migration } from "@halvardm/nessie";
 *
 * export default {
 *   async up({ client }) {
 *     await client.execute("CREATE TABLE users (id INTEGER PRIMARY KEY)");
 *   },
 *   async down({ client }) {
 *     await client.execute("DROP TABLE users");
 *   },
 * } satisfies Migration;
 * ```
 *
 * @module
 */
export * from "./lib/mod.ts";
