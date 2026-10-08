import { assertEquals, assertRejects } from "@std/assert";
import { join, toFileUrl } from "@std/path";
import { loadState } from "./state.ts";
import { NessieError } from "../utils/errors.ts";

const SQLITE = toFileUrl(join(Deno.cwd(), "clients/sqlite.ts")).href;

async function inTempDir(fn: () => Promise<void>) {
  const previous = Deno.cwd();
  const dir = await Deno.makeTempDir();
  Deno.chdir(dir);
  try {
    await Deno.writeTextFile(
      "nessie.config.ts",
      `import { SqliteClient } from "${SQLITE}";
       export default { client: new SqliteClient(":memory:") };`,
    );
    await fn();
  } finally {
    Deno.chdir(previous);
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("loadState finds the files in the folders", async () => {
  await inTempDir(async () => {
    await Deno.mkdir("db/migrations", { recursive: true });
    await Deno.mkdir("db/seeds", { recursive: true });
    await Deno.writeTextFile(
      "db/migrations/20240101120000_create_users.ts",
      "export default { async up() {}, async down() {} };",
    );
    // Not a valid migration name, so it is skipped
    await Deno.writeTextFile("db/migrations/create_posts.ts", "");
    await Deno.writeTextFile("db/seeds/users.ts", "");

    const state = await loadState({
      config: "./nessie.config.ts",
      info: () => undefined,
    });
    try {
      assertEquals(state.migrationFiles, [{
        name: "20240101120000_create_users.ts",
        path: toFileUrl(
          join(Deno.cwd(), "db/migrations/20240101120000_create_users.ts"),
        )
          .href,
      }]);
      assertEquals(state.seedFiles.map((f) => f.name), ["users.ts"]);
      assertEquals(await state.migrations.migrate(), [
        "20240101120000_create_users.ts",
      ]);
    } finally {
      await state.config.client.close();
    }
  });
});

Deno.test("loadState reports a missing folder", async () => {
  await inTempDir(async () => {
    const error = await assertRejects(
      () => loadState({ config: "./nessie.config.ts" }),
      NessieError,
    );
    assertEquals(
      error.message,
      `The migration folder ${
        join(Deno.cwd(), "db/migrations")
      } does not exist, run 'nessie init' to create it`,
    );
  });
});
