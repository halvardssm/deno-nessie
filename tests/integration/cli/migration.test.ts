import { assert, assertArrayIncludes } from "../../../deps.ts";
import {
  DIALECTS,
  runner,
  TYPE_MIGRATE,
  TYPE_ROLLBACK,
  TYPE_SEED,
} from "./config/migration.config.ts";

const strings = [
  {
    name: "Rollback none",
    string: [TYPE_ROLLBACK, "all"],
    solution: ["Nothing to rollback"],
  },
  {
    name: "Migrate 1",
    string: [TYPE_MIGRATE, "1"],
    solution: [
      "Starting migration of 3 files",
      "Migrating 20210508115213_test1.ts",
      "Done in",
      "Migrations completed in",
    ],
  },
  {
    name: "Migrate all",
    string: [TYPE_MIGRATE],
    solution: [
      "Starting migration of 2 files",
      "Migrating 20210508125213_test2.ts",
      "Done in ",
      "Migrating 20210508135213_test3.ts",
      "Migrations completed in ",
    ],
  },
  {
    name: "Seed",
    string: [TYPE_SEED, "seed.ts"],
    solution: [
      "Starting seeding of 1 files",
      "Seeding seed.ts",
      "Done in",
      "Seeding completed in ",
    ],
  },
  {
    name: "Migrate empty",
    string: [TYPE_MIGRATE],
    solution: ["Nothing to migrate"],
  },
  {
    name: "Rollback test3 and test2",
    string: [TYPE_ROLLBACK, "2"],
    solution: [
      "Starting rollback of 2 files",
      "Rolling back 20210508135213_test3.ts",
      "Done in ",
      "Rolling back 20210508125213_test2.ts",
      "Rollback completed in ",
    ],
  },
  {
    name: "Migrate test2 and test3",
    string: [TYPE_MIGRATE, "2"],
    solution: [
      "Starting migration of 2 files",
      "Migrating 20210508125213_test2.ts",
      "Done in ",
      "Migrating 20210508135213_test3.ts",
      "Migrations completed in ",
    ],
  },
  {
    name: "Rollback all",
    string: [TYPE_ROLLBACK, "all"],
    solution: [
      "Starting rollback of 3 files",
      "Done in",
      "Rolling back 20210508135213_test3.ts",
      "Rolling back 20210508125213_test2.ts",
      "Rolling back 20210508115213_test1.ts",
      "Rollback completed in ",
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

      solution.forEach((el) =>
        assert(
          response.some((res) => res.includes(el)),
          `Missing '${el}' from response`,
        )
      );
    });
  }
}
