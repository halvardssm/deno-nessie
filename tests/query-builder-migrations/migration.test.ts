import { assert, assertArrayIncludes } from "../../deps.ts";
import {
  DIALECTS,
  runner,
  TYPE_MIGRATE,
  TYPE_ROLLBACK,
} from "./config/migration.config.ts";

const strings = [
  {
    name: "Migrate and create table",
    string: [TYPE_MIGRATE],
    solution: [
      "Database setup complete",
      "Migrated 1587937822648-basics.ts",
      "Migrated 1587937822649-numerics.ts",
      "Migrated 1587937822650-strings-misc.ts",
      "Migration complete",
    ],
  },
  {
    name: "Rollback all",
    string: [TYPE_ROLLBACK, "all"],
    solution: [
      "Rolled back 1587937822650-strings-misc.ts",
      "Rolled back 1587937822649-numerics.ts",
      "Rolled back 1587937822648-basics.ts",
    ],
  },
];

for await (const dialect of DIALECTS) {
  let hasFailed = false;

  for await (const { name, string, solution } of strings) {
    Deno.test(`Migration ${dialect}: ` + (name || "Empty"), async () => {
      const response = await runner(dialect, string);
      hasFailed = response[response.length - 1].includes("Code was");

      assert(!hasFailed, response.join("\n"));
      assertArrayIncludes(response, solution);
    });
  }
}
