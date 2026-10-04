import { assertEquals } from "@std/assert";
import { join, toFileUrl } from "@std/path";
import { MigrationClient } from "../../lib/wrappers/migration-client.ts";
import type { FileEntry, NessieClient, NessieConfig } from "../../lib/types.ts";
import { MysqlClient } from "../../clients/mysql.ts";
import { PostgresClient } from "../../clients/postgres.ts";
import { SqliteClient } from "../../clients/sqlite.ts";

// Resolved once, as tests change directory
const EXAMPLES = join(Deno.cwd(), "examples");

const example = (name: string): FileEntry => ({
  name,
  path: toFileUrl(join(EXAMPLES, name)).href,
});

// The examples are named like their purpose, so give them migration names
const files = (
  entries: [string, string][],
): FileEntry[] =>
  entries.map(([name, from]) => ({
    name,
    path: example(from).path,
  }));

const databases: Record<string, () => NessieClient> = {
  sqlite: () => new SqliteClient(":memory:"),
  postgres: () =>
    new PostgresClient(
      Deno.env.get("NESSIE_TEST_POSTGRES") ??
        "postgres://root:pwd@localhost:5100/nessie",
    ),
  mysql: () =>
    new MysqlClient(
      Deno.env.get("NESSIE_TEST_MYSQL") ?? "mysql://root@localhost:5101/nessie",
    ),
};

async function cleanup(client: NessieClient) {
  for (const table of ["posts", "users", "nessie_migrations"]) {
    await client.executeScript(`DROP TABLE IF EXISTS ${table}`);
  }
}

for (const [name, create] of Object.entries(databases)) {
  Deno.test(`examples on ${name}`, async () => {
    const client = create();
    try {
      await cleanup(client);
      const migrations = new MigrationClient(client, {
        migrationFiles: files([
          ["20240101000000_users.ts", "migration.ts"],
          ["20240102000000_posts.ts", "migration-dialects.ts"],
        ]),
        seedFiles: [example("seed.ts")],
        info: () => undefined,
      });

      assertEquals((await migrations.migrate()).length, 2);
      assertEquals(
        await client.query("SELECT title FROM posts").toRecords(),
        [{ title: "Hello" }],
      );

      assertEquals(await migrations.seed(), ["seed.ts"]);
      assertEquals(
        await client.query("SELECT id, name FROM users").toRecords(),
        [{ id: 1, name: "Alice" }],
      );

      assertEquals((await migrations.rollback("all")).length, 2);
    } finally {
      await cleanup(client).catch(() => undefined);
      await client.close();
    }
  });
}

Deno.test("the custom client example keeps its own migration table", async () => {
  const previous = Deno.cwd();
  const examples = toFileUrl(join(EXAMPLES, "custom-client.ts"));
  const dir = await Deno.makeTempDir();
  Deno.chdir(dir); // the example creates ./history.db
  try {
    const config: NessieConfig = (await import(examples.href)).default;
    const migrations = new MigrationClient(config.client, {
      migrationFiles: files([["20240101000000_users.ts", "migration.ts"]]),
      info: () => undefined,
    });

    assertEquals(await migrations.migrate(), ["20240101000000_users.ts"]);
    assertEquals(
      await config.client.query("SELECT name FROM schema_history").toRecords(),
      [{ name: "20240101000000_users.ts" }],
    );
    assertEquals(await migrations.getApplied(), ["20240101000000_users.ts"]);
    assertEquals(await migrations.getModified(), []);
    assertEquals(await migrations.rollback(), ["20240101000000_users.ts"]);
    assertEquals(await migrations.getApplied(), []);
    await config.client.close();
  } finally {
    Deno.chdir(previous);
    await Deno.remove(dir, { recursive: true });
  }
});
