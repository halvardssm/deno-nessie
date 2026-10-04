import { assertEquals, assertRejects } from "@std/assert";
import { join, toFileUrl } from "@std/path";
import type { FileEntry, NessieClient } from "../../lib/types.ts";
import { MigrationClient } from "../../lib/wrappers/migration-client.ts";
import { MysqlClient } from "../../clients/mysql.ts";
import { PostgresClient } from "../../clients/postgres.ts";
import { SqliteClient } from "../../clients/sqlite.ts";

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

const MIGRATIONS = {
  "20240101000000_create_users.ts": `export default {
    async up({ client }) {
      await client.execute("CREATE TABLE nessie_test_users (id INTEGER, name VARCHAR(100))");
    },
    async down({ client }) { await client.execute("DROP TABLE nessie_test_users"); },
  };`,
  "20240102000000_add_alice.ts": `export default {
    async up({ client, dialect }) {
      await client.execute(
        "INSERT INTO nessie_test_users VALUES (" + dialect.placeholder(0) + ", " + dialect.placeholder(1) + ")",
        [1, "Alice"],
      );
    },
    async down({ client }) { await client.execute("DELETE FROM nessie_test_users"); },
  };`,
};

async function cleanup(client: NessieClient) {
  await client.executeScript("DROP TABLE IF EXISTS nessie_test_users");
  await client.executeScript("DROP TABLE IF EXISTS nessie_migrations");
}

for (const [name, create] of Object.entries(databases)) {
  Deno.test(`MigrationClient on ${name}`, async (t) => {
    const dir = await Deno.makeTempDir();
    const client = create();
    try {
      const migrationFiles: FileEntry[] = [];
      for (const [file, content] of Object.entries(MIGRATIONS)) {
        await Deno.writeTextFile(join(dir, file), content);
        migrationFiles.push({
          name: file,
          path: toFileUrl(join(dir, file)).href,
        });
      }
      await cleanup(client);
      const migrations = new MigrationClient(client, {
        migrationFiles,
        info: () => undefined,
      });

      await t.step("prepare is idempotent", async () => {
        await migrations.prepare();
        await migrations.prepare();
        assertEquals(await migrations.getApplied(), []);
      });

      await t.step("adds the checksum column to older tables", async () => {
        await client.execute(
          "ALTER TABLE nessie_migrations DROP COLUMN checksum",
        );
        await migrations.prepare();
        assertEquals(await migrations.getAppliedMigrations(), []);
      });

      await t.step("migrate applies and records migrations", async () => {
        assertEquals(await migrations.migrate(1), [
          "20240101000000_create_users.ts",
        ]);
        assertEquals(await migrations.migrate(), [
          "20240102000000_add_alice.ts",
        ]);
        assertEquals(await migrations.migrate(), []);
        assertEquals(await migrations.getApplied(), [
          "20240102000000_add_alice.ts",
          "20240101000000_create_users.ts",
        ]);
        assertEquals(
          await client.query("SELECT id, name FROM nessie_test_users")
            .toRecords(),
          [{ id: 1, name: "Alice" }],
        );
      });

      await t.step("detects modified migrations", async () => {
        assertEquals(await migrations.getModified(), []);
        assertEquals(
          (await migrations.getAppliedMigrations()).map((m) =>
            m.checksum?.length
          ),
          [64, 64],
        );
        const [first] = migrationFiles;
        const path = join(dir, first.name);
        const original = await Deno.readTextFile(path);
        await Deno.writeTextFile(path, original + "\n// edited\n");
        assertEquals(await migrations.getModified(), [first.name]);
        await Deno.writeTextFile(path, original);
        assertEquals(await migrations.getModified(), []);
      });

      await t.step("rollback reverts and forgets migrations", async () => {
        assertEquals(await migrations.rollback(), [
          "20240102000000_add_alice.ts",
        ]);
        assertEquals(await migrations.rollback("all"), [
          "20240101000000_create_users.ts",
        ]);
        assertEquals(await migrations.getApplied(), []);
        await assertRejects(() =>
          client.query("SELECT * FROM nessie_test_users").toRecords()
        );
      });
    } finally {
      await cleanup(client).catch(() => undefined);
      await client.close();
      await Deno.remove(dir, { recursive: true });
    }
  });
}
