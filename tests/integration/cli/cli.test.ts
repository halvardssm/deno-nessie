import { assert } from "../../../deps.ts";
import {
  DIALECTS,
  runner,
  TYPE_MIGRATE,
  TYPE_ROLLBACK,
  TYPE_SEED,
  TYPE_STATUS,
} from "./config/cli.config.ts";

const strings = [
  {
    name: "Status initial with name",
    string: [TYPE_STATUS, "--file-names"],
    solution: [
      "Status",
      "totalAvailableMigrationFiles: 3",
      "completedMigrations: 0",
      "newAvailableMigrations: 3",
      "20210508115213_test1.ts",
      "20210508125213_test2.ts",
      "20210508135213_test3.ts",
    ],
  },
  {
    name: "Status initial with json",
    string: [TYPE_STATUS, "--output=json"],
    solution: [
      '{"totalAvailableMigrationFiles":3,"completedMigrations":0,"newAvailableMigrations":3}',
    ],
  },
  {
    name: "Status initial with name and json",
    string: [TYPE_STATUS, "--file-names", "--output=json"],
    solution: [
      '{"totalAvailableMigrationFiles":3,"completedMigrations":0,"newAvailableMigrations":3,"totalAvailableMigrationFileNames":["20210508115213_test1.ts","20210508125213_test2.ts","20210508135213_test3.ts"],"completedMigrationNames":[],"newAvailableMigrationNames":["20210508115213_test1.ts","20210508125213_test2.ts","20210508135213_test3.ts"]}',
    ],
  },
  {
    name: "Status 1",
    string: [TYPE_STATUS],
    solution: [
      "Status",
      "totalAvailableMigrationFiles: 3",
      "completedMigrations: 0",
      "newAvailableMigrations: 3",
    ],
  },
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
    name: "Status 2",
    string: [TYPE_STATUS],
    solution: [
      "Status",
      "totalAvailableMigrationFiles: 3",
      "completedMigrations: 1",
      "newAvailableMigrations: 2",
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
    name: "Status 3",
    string: [TYPE_STATUS],
    solution: [
      "Status",
      "totalAvailableMigrationFiles: 3",
      "completedMigrations: 3",
      "newAvailableMigrations: 0",
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
    name: "Status 4",
    string: [TYPE_STATUS],
    solution: [
      "Status",
      "totalAvailableMigrationFiles: 3",
      "completedMigrations: 1",
      "newAvailableMigrations: 2",
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
    name: "Status 5",
    string: [TYPE_STATUS],
    solution: [
      "Status",
      "totalAvailableMigrationFiles: 3",
      "completedMigrations: 3",
      "newAvailableMigrations: 0",
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
    name: "Status 6",
    string: [TYPE_STATUS],
    solution: [
      "Status",
      "totalAvailableMigrationFiles: 3",
      "completedMigrations: 0",
      "newAvailableMigrations: 3",
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
