import { assert, assertEquals, assertRejects } from "@std/assert";
import { join, toFileUrl } from "@std/path";
import {
  arrayIsUnique,
  getDurationFromTimestamp,
  getLogger,
  isFileUrl,
  isMigrationFile,
  isRemoteUrl,
  isUrl,
  listMigrationFiles,
} from "./utils.ts";
import { NessieError } from "./errors.ts";

Deno.test("isUrl", () => {
  assert(isUrl("file:///a.ts"));
  assert(isUrl("https://a.com/a.ts"));
  assert(isRemoteUrl("http://a.com/a.ts"));
  assert(isFileUrl("file:///a.ts"));
  assert(!isUrl("./a.ts"));
  assert(!isRemoteUrl("file:///a.ts"));
});

Deno.test("isMigrationFile", () => {
  assert(isMigrationFile("20240101120000_create_users.ts"));
  assert(!isMigrationFile("20240101120000-create-users.ts"));
  assert(!isMigrationFile("20240101120000_Create_users.ts"));
  assert(!isMigrationFile("create_users.ts"));
  assert(!isMigrationFile(`20240101120000_${"a".repeat(100)}.ts`));
});

async function withMigrationFolder(
  fn: (dir: string, url: URL) => Promise<void>,
) {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      join(dir, "20240101120000_create_users.ts"),
      "export default { async up() {}, async down() {} };",
    );
    await Deno.writeTextFile(
      join(dir, "20240101000000_first.ts"),
      "export default { async up() {}, async down() {} };",
    );
    // Not a valid migration name, so it is skipped
    await Deno.writeTextFile(join(dir, "create_posts.ts"), "");
    await Deno.writeTextFile(join(dir, "notes.txt"), "");
    // A folder with a migration name is skipped too
    await Deno.mkdir(join(dir, "20240102000000_sub.ts"));
    await Deno.mkdir(join(dir, "empty"));

    await fn(dir, toFileUrl(dir));
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("listMigrationFiles scans a folder, sorted, with file URLs", async () => {
  await withMigrationFolder(async (dir, url) => {
    const expected = [
      {
        name: "20240101000000_first.ts",
        path: toFileUrl(join(dir, "20240101000000_first.ts")).href,
      },
      {
        name: "20240101120000_create_users.ts",
        path: toFileUrl(join(dir, "20240101120000_create_users.ts")).href,
      },
    ];

    assertEquals(await listMigrationFiles(dir), expected);
    assertEquals(await listMigrationFiles(url), expected);
    assertEquals(await listMigrationFiles(url.href), expected);
    assertEquals(await listMigrationFiles(join(dir, "empty")), []);
  });
});

Deno.test("listMigrationFiles with an empty or missing folder", async () => {
  const dir = await Deno.makeTempDir();
  try {
    assertEquals(await listMigrationFiles(dir), []);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }

  const missing = join(dir, "does_not_exist");
  await assertRejects(
    () => listMigrationFiles(missing),
    NessieError,
    `The folder ${toFileUrl(missing).href} does not exist`,
  );
  assertEquals(
    await listMigrationFiles(missing, { onMissingFolder: "empty" }),
    [],
  );
  await assertRejects(
    () => listMigrationFiles("https://example.com/migrations"),
    NessieError,
    "can not be scanned",
  );
});

Deno.test("listMigrationFiles with a custom accept", async () => {
  await withMigrationFolder(async (dir) => {
    const names = (await listMigrationFiles(dir, {
      accept: (name) => name.endsWith(".ts"),
    })).map((f) => f.name);

    assertEquals(names, [
      "20240101000000_first.ts",
      "20240101120000_create_users.ts",
      "create_posts.ts",
    ]);
  });
});

Deno.test("arrayIsUnique", () => {
  assert(arrayIsUnique([1, 2, 3]));
  assert(!arrayIsUnique([1, 2, 2]));
});

Deno.test("getDurationFromTimestamp", () => {
  assertEquals(getDurationFromTimestamp(0, 1500), "1.50");
});

Deno.test("getLogger is silent unless debug", () => {
  const log = console.log;
  const lines: unknown[] = [];
  console.log = (...args) => lines.push(...args);
  try {
    getLogger()("hidden", "t");
    assertEquals(lines, []);
    getLogger(true)("shown", "t");
    assertEquals(lines, ["t: ", "shown"]);
  } finally {
    console.log = log;
  }
});
