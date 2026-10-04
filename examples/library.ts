import { toFileUrl } from "@std/path";
import { MigrationClient } from "../mod.ts";
import { SqliteClient } from "../clients/sqlite.ts";

/**
 * Nessie can be used without the CLI: give a `MigrationClient` a client and
 * the migration files, and call `migrate`, `rollback`, `seed` and friends.
 *
 * Run with: deno run -A examples/library.ts
 */

// Migration files are anything `import()` accepts, here a file URL
const migrationFiles = [
  {
    name: "20240101000000_create_users.ts",
    path: toFileUrl(await Deno.realPath("examples/migration.ts")).href,
  },
];

await using client = new SqliteClient(":memory:");
const migrations = new MigrationClient(client, {
  migrationFiles,
  // Progress goes to `info`, warnings (e.g. edited migrations) to `warn`
  info: (message) => console.info(message),
  warn: (message) => console.warn(message),
});

console.log("Migrated:", await migrations.migrate());
console.log("Applied:", await migrations.getApplied());
console.log("Modified since applied:", await migrations.getModified());
console.log("Rolled back:", await migrations.rollback("all"));
