import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { join, toFileUrl } from "@std/path";
import { runCommand } from "@stdext/cli";
import { cli } from "./commands.ts";
import { NessieError } from "../utils/errors.ts";

const SQLITE = toFileUrl(join(Deno.cwd(), "clients/sqlite.ts")).href;

async function inTempDir(
  fn: (run: (...args: string[]) => Promise<[number, string]>) => Promise<void>,
) {
  const previous = Deno.cwd();
  const dir = await Deno.makeTempDir();
  Deno.chdir(dir);
  try {
    let n = 0;
    await fn(async (...args) => {
      // every run gets a fresh config module, and so a fresh client
      if (args[0] !== "init") {
        const url = toFileUrl(join(Deno.cwd(), "nessie.config.ts")).href;
        args = [...args, "--config", `${url}?run=${n++}`];
      }
      const lines: string[] = [];
      const code = await runCommand(cli, args, {
        stdout: (l) => lines.push(l),
        stderr: (l) => lines.push(l),
      });
      return [code, lines.join("\n")];
    });
  } finally {
    Deno.chdir(previous);
    await Deno.remove(dir, { recursive: true });
  }
}

async function writeConfig() {
  await Deno.writeTextFile(
    "nessie.config.ts",
    `import { SqliteClient } from "${SQLITE}";
     export default { client: new SqliteClient("./test.db") };`,
  );
}

async function writeMigration(name: string, body: string) {
  await Deno.writeTextFile(join("db/migrations", name), body);
}

Deno.test("init creates config and folders, and is idempotent", async () => {
  await inTempDir(async (run) => {
    const [code, out] = await run("init", "--dialect", "sqlite");
    assertEquals(code, 0);
    assertStringIncludes(out, "Created config file");
    assertStringIncludes(
      await Deno.readTextFile("nessie.config.ts"),
      "SqliteClient",
    );
    assertEquals((await Deno.stat("db/migrations/.gitkeep")).isFile, true);
    assertEquals((await Deno.stat("db/seeds/.gitkeep")).isFile, true);

    const [, again] = await run("init");
    assertStringIncludes(again, "Config file already exists");
  });
});

Deno.test("init rejects invalid options", async () => {
  await inTempDir(async (run) => {
    assertEquals((await run("init", "--mode", "nope"))[0], 2);
    assertEquals((await run("init", "--dialect", "oracle"))[0], 2);
  });
});

Deno.test("migrate, status and rollback end to end", async () => {
  await inTempDir(async (run) => {
    await run("init", "--mode", "folders");
    await writeConfig();
    await writeMigration(
      "20240101000000_create_users.ts",
      `export default {
        async up({ client }) { await client.execute("CREATE TABLE users (id INTEGER)"); },
        async down({ client }) { await client.execute("DROP TABLE users"); },
      };`,
    );

    const [, before] = await run("status", "--output", "json");
    assertEquals(JSON.parse(before), {
      totalAvailableMigrationFiles: 1,
      completedMigrations: 0,
      newAvailableMigrations: 1,
      modifiedMigrations: 0,
    });

    const [code, out] = await run("migrate");
    assertEquals(code, 0);
    assertStringIncludes(out, "Migrating 20240101000000_create_users.ts");

    const [, after] = await run("status", "--output", "json", "--file-names");
    assertEquals(JSON.parse(after).completedMigrationNames, [
      "20240101000000_create_users.ts",
    ]);
    assertStringIncludes((await run("status"))[1], "completedMigrations: 1");

    assertStringIncludes((await run("migrate"))[1], "Nothing to migrate");
    assertStringIncludes((await run("rollback"))[1], "Rolling back");
    assertStringIncludes(
      (await run("rollback", "--amount", "all"))[1],
      "Nothing to rollback",
    );
    assertEquals((await run("migrate", "--amount", "abc"))[0], 2);
  });
});

Deno.test("make:migration and make:seed create files", async () => {
  await inTempDir(async (run) => {
    await run("init", "--mode", "folders");
    await writeConfig();

    const [code, out] = await run("make:migration", "--name", "create_posts");
    assertEquals(code, 0);
    assertStringIncludes(out, "Created migration");
    const migrations = [...Deno.readDirSync("db/migrations")].filter((e) =>
      e.name.endsWith("_create_posts.ts")
    );
    assertEquals(migrations.length, 1);
    assertStringIncludes(
      await Deno.readTextFile(join("db/migrations", migrations[0].name)),
      "satisfies Migration",
    );
    assertEquals((await run("make", "--name", "other_one"))[0], 0);
    assertEquals((await run("make:migration", "--name", "Bad-Name"))[0], 2);

    assertEquals((await run("make:seed", "--name", "users"))[0], 0);
    assertStringIncludes(
      await Deno.readTextFile("db/seeds/users.ts"),
      "satisfies Seed",
    );
    await assertRejects(
      () => run("make:seed", "--name", "users"),
      NessieError,
      "already exists",
    );
    assertEquals((await run("make:seed", "--name", "users", "--force"))[0], 0);
  });
});

Deno.test("seed runs seed files", async () => {
  await inTempDir(async (run) => {
    await run("init", "--mode", "folders");
    await writeConfig();
    await Deno.writeTextFile(
      "db/seeds/users.ts",
      `export default { async run({ client }) {
        await client.execute("CREATE TABLE seeded (id INTEGER)");
      } };`,
    );
    const [code, out] = await run("seed");
    assertEquals(code, 0);
    assertStringIncludes(out, "Seeding users.ts");
  });
});

Deno.test("missing config reports an error", async () => {
  await inTempDir(async (run) => {
    await assertRejects(() => run("migrate"), NessieError, "not found");
  });
});

Deno.test("status and migrate warn about modified migrations", async () => {
  await inTempDir(async (run) => {
    await run("init", "--mode", "folders");
    await writeConfig();
    const file = "20240101000000_create_users.ts";
    const body = `export default {
      async up({ client }) { await client.execute("CREATE TABLE users (id INTEGER)"); },
      async down({ client }) { await client.execute("DROP TABLE users"); },
    };`;
    await writeMigration(file, body);
    await run("migrate");

    const [, clean] = await run("status");
    assertEquals(clean.includes("Warning"), false);
    assertStringIncludes(clean, "modifiedMigrations: 0");

    await writeMigration(file, body + "\n// edited\n");

    const [code, out] = await run("status", "--file-names");
    assertEquals(code, 0);
    assertStringIncludes(out, "modifiedMigrations: 1");
    assertStringIncludes(out, `Warning: migration ${file} has been modified`);
    assertEquals(
      JSON.parse((await run("status", "--output", "json"))[1])
        .modifiedMigrations,
      1,
    );

    // migrate still succeeds, and warns on the error output
    const [migrateCode, migrateOut] = await run("migrate");
    assertEquals(migrateCode, 0);
    assertStringIncludes(migrateOut, "has been modified since it was applied");
  });
});

Deno.test("a client without the nessie interface is rejected", async () => {
  await inTempDir(async (run) => {
    await run("init", "--mode", "folders");
    // The plain client of `@stdext/database` does not keep the migration table
    await Deno.writeTextFile(
      "nessie.config.ts",
      `import { SqliteClient } from "@stdext/database/drivers/sqlite";
       export default { client: new SqliteClient(":memory:") };`,
    );
    await assertRejects(
      () => run("migrate"),
      NessieError,
      "does not implement the nessie client interface",
    );
  });
});

Deno.test("arguments are flags, and positional arguments are rejected", async () => {
  await inTempDir(async (run) => {
    await run("init", "--mode", "folders");
    await writeConfig();
    await writeMigration(
      "20240101000000_create_users.ts",
      `export default {
        async up({ client }) { await client.execute("CREATE TABLE users (id INTEGER)"); },
        async down({ client }) { await client.execute("DROP TABLE users"); },
      };`,
    );
    await Deno.writeTextFile(
      "db/seeds/users.ts",
      `export default { async run({ client }) {
        await client.execute("INSERT INTO users VALUES (1)");
      } };`,
    );

    // the name is required
    assertEquals((await run("make:migration"))[0], 2);
    assertEquals((await run("make:seed"))[0], 2);
    // the old positional form fails, instead of being ignored
    assertEquals((await run("make:migration", "create_posts"))[0], 2);
    assertEquals((await run("migrate", "1"))[0], 2);
    assertEquals((await run("rollback", "all"))[0], 2);
    assertEquals((await run("seed", "users"))[0], 2);

    // the short flags
    assertEquals((await run("make", "-n", "other_one"))[0], 0);
    assertEquals((await run("make:seed", "-n", "more"))[0], 0);
    assertStringIncludes((await run("migrate", "-a", "1"))[1], "Migrating");
    assertStringIncludes(
      (await run("seed", "-m", "users"))[1],
      "Seeding users",
    );
    assertStringIncludes((await run("seed", "-m", "nope"))[1], "No seed file");
    assertStringIncludes((await run("rollback", "-a", "1"))[1], "Rolling back");
  });
});
