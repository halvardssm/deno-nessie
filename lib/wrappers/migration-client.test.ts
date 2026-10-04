import { assertEquals, assertRejects } from "@std/assert";
import { join, toFileUrl } from "@std/path";
import { SqliteClient } from "../../clients/sqlite.ts";
import { getChecksum, MigrationClient } from "./migration-client.ts";
import { NessieError } from "../utils/errors.ts";
import type { FileEntry } from "../types.ts";

async function withFixture(
  fn: (
    ctx: { client: SqliteClient; migrations: MigrationClient },
  ) => Promise<void>,
  extra: Record<string, string> = {},
  warnings: string[] = [],
) {
  const dir = await Deno.makeTempDir();
  const files: Record<string, string> = {
    "20240101000000_create_users.ts": `export default {
      async up({ client }) { await client.execute("CREATE TABLE users (id INTEGER, name TEXT)"); },
      async down({ client }) { await client.execute("DROP TABLE users"); },
    };`,
    "20240102000000_add_alice.ts": `export default {
      async up({ client, dialect }) {
        await client.execute("INSERT INTO users VALUES (" + dialect.placeholder(0) + ", 'Alice')", [1]);
      },
      async down({ client }) { await client.execute("DELETE FROM users"); },
    };`,
    ...extra,
  };
  const entries: FileEntry[] = [];
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    await Deno.writeTextFile(path, content);
    entries.push({ name, path: toFileUrl(path).href });
  }
  await using client = new SqliteClient(":memory:");
  const migrations = new MigrationClient(client, {
    migrationFiles: entries,
    seedFiles: [],
    info: () => undefined,
    warn: (message) => warnings.push(message),
  });
  try {
    await fn({ client, migrations });
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("migrate applies pending migrations in order and records them", async () => {
  await withFixture(async ({ client, migrations }) => {
    assertEquals(await migrations.migrate(), [
      "20240101000000_create_users.ts",
      "20240102000000_add_alice.ts",
    ]);
    assertEquals(await client.query("SELECT * FROM users").toRecords(), [
      { id: 1, name: "Alice" },
    ]);
    assertEquals(await migrations.getApplied(), [
      "20240102000000_add_alice.ts",
      "20240101000000_create_users.ts",
    ]);
    assertEquals(await migrations.migrate(), []);
  });
});

Deno.test("migrate respects the amount", async () => {
  await withFixture(async ({ migrations }) => {
    assertEquals(await migrations.migrate(1), [
      "20240101000000_create_users.ts",
    ]);
    assertEquals(await migrations.migrate(1), [
      "20240102000000_add_alice.ts",
    ]);
  });
});

Deno.test("rollback defaults to one, supports all", async () => {
  await withFixture(async ({ client, migrations }) => {
    await migrations.migrate();
    assertEquals(await migrations.rollback(), [
      "20240102000000_add_alice.ts",
    ]);
    assertEquals(await client.query("SELECT * FROM users").toRecords(), []);
    assertEquals(await migrations.rollback("all"), [
      "20240101000000_create_users.ts",
    ]);
    assertEquals(await migrations.rollback(), []);
  });
});

Deno.test("a failing migration is rolled back and not recorded", async () => {
  await withFixture(async ({ client, migrations }) => {
    await assertRejects(() => migrations.migrate());
    // the migrations before the broken one stay applied
    assertEquals(await migrations.getApplied(), [
      "20240102000000_add_alice.ts",
      "20240101000000_create_users.ts",
    ]);
    // the failed migration's first statement was undone with its transaction
    const tables = await client.query(
      "SELECT name FROM sqlite_master WHERE name = 'half'",
    ).toRecords();
    assertEquals(tables, []);
  }, {
    "20240103000000_broken.ts": `export default {
      async up({ client }) {
        await client.execute("CREATE TABLE half (id INTEGER)");
        await client.execute("INSERT INTO missing VALUES (1)");
      },
      async down() {},
    };`,
    "20240102000000_add_alice.ts":
      `export default { async up() {}, async down() {} };`,
  });
});

Deno.test("transaction: false runs without a transaction", async () => {
  await withFixture(async ({ client, migrations }) => {
    await assertRejects(() => migrations.migrate());
    const tables = await client.query(
      "SELECT name FROM sqlite_master WHERE name = 'half'",
    ).toRecords();
    assertEquals(tables, [{ name: "half" }]);
  }, {
    "20240103000000_broken.ts": `export default {
      transaction: false,
      async up({ client }) {
        await client.execute("CREATE TABLE half (id INTEGER)");
        await client.execute("INSERT INTO missing VALUES (1)");
      },
      async down() {},
    };`,
    "20240102000000_add_alice.ts":
      `export default { async up() {}, async down() {} };`,
  });
});

Deno.test("invalid migration module is rejected", async () => {
  await withFixture(async ({ migrations }) => {
    await assertRejects(
      () => migrations.migrate(),
      NessieError,
      "must have a default export",
    );
  }, { "20240103000000_bad.ts": `export default {};` });
});

Deno.test("rollback fails for a missing migration file", async () => {
  await withFixture(async ({ client, migrations }) => {
    await migrations.prepare();
    await client.execute(
      "INSERT INTO nessie_migrations (file_name) VALUES ('20990101000000_gone.ts')",
    );
    await assertRejects(
      () => migrations.rollback(),
      NessieError,
      "is not found",
    );
  });
});

Deno.test("seed runs matching seeds", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = join(dir, "users.ts");
    await Deno.writeTextFile(
      path,
      `export default { async run({ client }) { await client.execute("INSERT INTO users VALUES (2, 'Bob')"); } };`,
    );
    await using client = new SqliteClient(":memory:");
    await client.execute("CREATE TABLE users (id INTEGER, name TEXT)");
    const migrations = new MigrationClient(client, {
      seedFiles: [{ name: "users.ts", path: toFileUrl(path).href }],
      info: () => undefined,
    });
    assertEquals(await migrations.seed("nope"), []);
    assertEquals(await migrations.seed("users"), ["users.ts"]);
    assertEquals(await client.query("SELECT * FROM users").toRecords(), [
      { id: 2, name: "Bob" },
    ]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("modified migrations are detected, warned about, and not blocking", async () => {
  const warnings: string[] = [];
  await withFixture(
    async ({ migrations }) => {
      await migrations.migrate();
      assertEquals(await migrations.getModified(), []);

      const [first] = migrations.migrationFiles;
      await Deno.writeTextFile(
        new URL(first.path),
        (await Deno.readTextFile(new URL(first.path))) + "\n// edited\n",
      );

      assertEquals(await migrations.getModified(), [first.name]);
      // the migration is still considered applied, and nothing blocks
      assertEquals(await migrations.migrate(), []);
      assertEquals(warnings, [
        `Warning: migration ${first.name} has been modified since it was applied`,
      ]);
    },
    {},
    warnings,
  );
});

Deno.test("checksums ignore line endings", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const lf = join(dir, "lf.ts");
    const crlf = join(dir, "crlf.ts");
    await Deno.writeTextFile(lf, "a\nb\n");
    await Deno.writeTextFile(crlf, "a\r\nb\r\n");
    assertEquals(
      await getChecksum({ name: "lf.ts", path: toFileUrl(lf).href }),
      await getChecksum({ name: "crlf.ts", path: toFileUrl(crlf).href }),
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("a table without checksums is upgraded and backfilled", async () => {
  const warnings: string[] = [];
  await withFixture(
    async ({ client, migrations }) => {
      // the table as created before checksums existed
      await client.execute(
        "CREATE TABLE nessie_migrations (id integer NOT NULL PRIMARY KEY autoincrement, file_name varchar(100) NOT NULL UNIQUE, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP)",
      );
      await client.execute(
        "INSERT INTO nessie_migrations (file_name) VALUES ('20240101000000_create_users.ts')",
      );
      await client.execute("CREATE TABLE users (id INTEGER, name TEXT)");

      await migrations.prepare();
      assertEquals(await migrations.getAppliedMigrations(), [{
        name: "20240101000000_create_users.ts",
        checksum: null,
      }]);
      // nothing to compare to, so no modification is reported
      assertEquals(await migrations.getModified(), []);

      assertEquals(await migrations.migrate(), ["20240102000000_add_alice.ts"]);
      const applied = await migrations.getAppliedMigrations();
      assertEquals(applied.every((m) => m.checksum?.length === 64), true);
      assertEquals(warnings, []);
    },
    {},
    warnings,
  );
});
