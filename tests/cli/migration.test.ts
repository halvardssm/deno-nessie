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
      "Migrated 1587937822648-test1.ts",
      "Migrated 1587937822649-test2.ts",
      "Migrated 1587937822650-test3.ts",
      "Migration complete",
    ],
  },
  {
    name: "Migrate empty",
    string: TYPE_MIGRATE,
    solution: ["Nothing to migrate"],
  },
  {
    name: "Rollback test3",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822650-test3.ts"],
  },
  {
    name: "Rollback test2",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822649-test2.ts"],
  },
  {
    name: "Migrate test2 and test3",
    string: TYPE_MIGRATE,
    solution: [
      "Migrated 1587937822649-test2.ts",
      "Migrated 1587937822650-test3.ts",
      "Migration complete",
    ],
  },
  {
    name: "Rollback test3",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822650-test3.ts"],
  },
  {
    name: "Rollback test2",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822649-test2.ts"],
  },
  {
    name: "Rollback test1",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822648-test1.ts"],
  },
  {
    name: "Rollback empty",
    string: TYPE_ROLLBACK,
    solution: ["Nothing to rollback"],
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
