import { assert, assertArrayContains } from "../../deps.ts";
import {
  DIALECTS,
  runner,
  TYPE_MIGRATE,
  TYPE_ROLLBACK,
  DIALECT_PG,
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
    name: "Migrate empty",
    string: TYPE_MIGRATE,
    solution: ["Nothing to migrate"],
  },
  {
    name: "Rollback strings-misc",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822650-strings-misc.ts"],
  },
  {
    name: "Rollback numerics",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822649-numerics.ts"],
  },
  {
    name: "Migrate numerics and strings-misc",
    string: TYPE_MIGRATE,
    solution: [
      "Migrated 1587937822649-numerics.ts",
      "Migrated 1587937822650-strings-misc.ts",
      "Migration complete",
    ],
  },
  {
    name: "Rollback strings-misc",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822650-strings-misc.ts"],
  },
  {
    name: "Rollback numerics",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822649-numerics.ts"],
  },
  {
    name: "Rollback basics",
    string: TYPE_ROLLBACK,
    solution: ["Rolled back 1587937822648-basics.ts"],
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
