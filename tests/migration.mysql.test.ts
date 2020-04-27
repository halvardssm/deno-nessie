import {
  assert,
  fail,
  assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
const decoder = new TextDecoder();

const TYPE_MIGRATE = "migrate";
const TYPE_ROLLBACK = "rollback";

const runner = async (type: string) => {
  const r = Deno.run(
    {
      cmd: [
        "deno",
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "cli.ts",
        type,
        "-c",
        "./config/mysql.config.ts",
      ],
      stdout: "piped",
    },
  );

  const { code } = await r.status();

  if (code === 0) {
    const rawOutput = await r.output();
    r.close();
    return decoder.decode(rawOutput);
  } else {
    return `Code was ${code}`;
  }
};

const strings = [
  {
    name: "Migrate and create table",
    string: async () => await runner(TYPE_MIGRATE),
    solution:
      "Database setup complete\nMigrated 1587937822648-test.ts\nMigration complete\n",
  },
  {
    name: "Migrate empty",
    string: async () => await runner(TYPE_MIGRATE),
    solution: "Nothing to migrate\n",
  },
  {
    name: "Rollback",
    string: async () => await runner(TYPE_ROLLBACK),
    solution: "Rolled back 1587937822648-test.ts\n",
  },
  {
    name: "Rollback empty",
    string: async () => await runner(TYPE_ROLLBACK),
    solution: "Nothing to rollback\n",
  },
  {
    name: "Migrate",
    string: async () => await runner(TYPE_MIGRATE),
    solution: "Migrated 1587937822648-test.ts\nMigration complete\n",
  },
];

for await (const { name, string, solution } of strings) {
  Deno.test("MySQL Migration: " + (name || "Empty"), async () => {
    assertEquals(await string(), solution);
  });
}
