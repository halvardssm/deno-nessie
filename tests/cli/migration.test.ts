import { assert, assertArrayContains } from "../../deps.ts";
import {
  DIALECTS,
  runner,
  TYPE_MIGRATE,
  TYPE_ROLLBACK,
} from "./config/migration.config.ts";

const strings = [
  {
    name: "Rollback none",
    string: [TYPE_ROLLBACK ,"all"],
    solution: ["Nothing to rollback"],
  },
  {
    name: "Migrate 1",
    string: [TYPE_MIGRATE, "1"],
    solution: [
      "Migrated 1587937822648-test1.ts",
      "Migration complete",
    ],
  },
  {
    name: "Migrate all",
    string: [TYPE_MIGRATE],
    solution: [
      "Migrated 1587937822649-test2.ts",
      "Migrated 1587937822650-test3.ts",
      "Migration complete",
    ],
  },
  {
    name: "Migrate empty",
    string: [TYPE_MIGRATE],
    solution: ["Nothing to migrate"],
  },
  {
    name: "Rollback test3 and test2",
    string: [TYPE_ROLLBACK , "2"],
    solution: [
      "Rolled back 1587937822650-test3.ts",
      "Rolled back 1587937822649-test2.ts",
    ],
  },
  {
    name: "Migrate test2 and test3",
    string: [TYPE_MIGRATE ,"2"],
    solution: [
      "Migrated 1587937822649-test2.ts",
      "Migrated 1587937822650-test3.ts",
      "Migration complete",
    ],
  },
  {
    name: "Rollback all",
    string: [TYPE_ROLLBACK ,"all"],
    solution: [
      "Rolled back 1587937822650-test3.ts",
      "Rolled back 1587937822649-test2.ts",
      "Rolled back 1587937822648-test1.ts",
    ],
  },
  {
    name: "Rollback empty",
    string: [TYPE_ROLLBACK],
    solution: ["Nothing to rollback"],
  },
];

for await (const dialect of DIALECTS) {
  let hasFailed = false;

  for await (const { name, string, solution } of strings) {
    Deno.test(`Migration ${dialect}: ` + (name || "Empty"), async () => {

      const response = await runner(dialect, string);
      hasFailed = response[response.length - 1].includes("Code was");

      assert(!hasFailed, response.join("\n"));
      assertArrayContains(response, solution);
    });
  }
}
