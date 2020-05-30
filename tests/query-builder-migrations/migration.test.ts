import { assert, assertArrayContains } from "../../deps.ts";
import {
  DIALECTS,
  runner,
  TYPE_MIGRATE,
  TYPE_ROLLBACK,
} from "./config/migration.config.ts";

const strings = [
  {
    name: "Migrate and create table",
    string: TYPE_MIGRATE,
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
    string: TYPE_ROLLBACK,
    solution: [
      "Rolled back 1587937822650-strings-misc.ts",
      "Rolled back 1587937822649-numerics.ts",
      "Rolled back 1587937822648-basics.ts",
    ],
  },
];

// const dialect = DIALECT_PG;
for await (const dialect of DIALECTS) {
  let hasFailed = false;

  for await (const { name, string, solution } of strings) {
    Deno.test(`Migration ${dialect}: ` + (name || "Empty"), async () => {
      // if (hasFailed) {
      //   assert(false, "Skipped")
      // } else {
      const response = await runner(string, dialect);
      hasFailed = response[response.length - 1].includes("Code was");

      assert(!hasFailed, response.join("\n"));
      assertArrayContains(response, solution);
      // }
    });
    // if (hasFailed) break
  }
}
