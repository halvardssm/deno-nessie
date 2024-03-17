import { join, resolve } from "@std/path";
import { DbDialects } from "../mod.ts";
import { describe, it } from "@std/testing/bdd";
import { assertCommandOutput } from "../lib/utils/assert.ts";

describe("integration cli", () => {
  describe("command flow", () => {
    const fileDir = resolve("./tests/cli");

    async function commandFlowTest(dialect: DbDialects) {
      const configFilePath = join(fileDir, `${dialect}.config.ts`);

      const argsPre = [
        "run",
        "-A",
        "--unstable-ffi",
        "cli.ts",
      ];
      const argsPost = [
        "-c",
        configFilePath,
        // "-d",
      ];

      async function commandRunner(args: string[]) {
        return await new Deno.Command(Deno.execPath(), {
          args: [
            ...argsPre,
            ...args,
            ...argsPost,
          ],
        }).output();
      }

      assertCommandOutput(
        await commandRunner(["status", "--file-names"]),
        {
          stdoutIncludes: [
            "Database setup complete",
            "Status",
            "totalAvailableMigrationFiles: 3",
            "20210508115213_test1.ts",
            "20210508125213_test2.ts",
            "20210508135213_test3.ts",
            "completedMigrations: 0",
            "newAvailableMigrations: 3",
            "20210508115213_test1.ts",
            "20210508125213_test2.ts",
            "20210508135213_test3.ts",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["status", "--output=json"]),
        {
          stdoutIncludes:
            `{"totalAvailableMigrationFiles":3,"completedMigrations":0,"newAvailableMigrations":3}`,
        },
      );

      assertCommandOutput(
        await commandRunner(["status", "--file-names", "--output=json"]),
        {
          stdoutIncludes:
            `{"totalAvailableMigrationFiles":3,"completedMigrations":0,"newAvailableMigrations":3,"totalAvailableMigrationFileNames":["20210508115213_test1.ts","20210508125213_test2.ts","20210508135213_test3.ts"],"completedMigrationNames":[],"newAvailableMigrationNames":["20210508115213_test1.ts","20210508125213_test2.ts","20210508135213_test3.ts"]}`,
        },
      );

      assertCommandOutput(
        await commandRunner(["status"]),
        {
          stdoutIncludes: [
            "Status",
            "totalAvailableMigrationFiles: 3",
            "completedMigrations: 0",
            "newAvailableMigrations: 3",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["rollback", "all"]),
        {
          stdoutIncludes: ["Nothing to rollback"],
        },
      );

      assertCommandOutput(
        await commandRunner(["migrate", "1"]),
        {
          stdoutIncludes: [
            "Starting migration of 3 files",
            "Migrating 20210508115213_test1.ts",
            "Done in",
            "Migrations completed in",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["status"]),
        {
          stdoutIncludes: [
            "Status",
            "totalAvailableMigrationFiles: 3",
            "completedMigrations: 1",
            "newAvailableMigrations: 2",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["migrate"]),
        {
          stdoutIncludes: [
            "Starting migration of 2 files",
            "Migrating 20210508125213_test2.ts",
            "Done in ",
            "Migrating 20210508135213_test3.ts",
            "Migrations completed in ",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["status"]),
        {
          stdoutIncludes: [
            "Status",
            "totalAvailableMigrationFiles: 3",
            "completedMigrations: 3",
            "newAvailableMigrations: 0",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["seed", "seed.ts"]),
        {
          stdoutIncludes: [
            "Starting seeding of 1 files",
            "Seeding seed.ts",
            "Done in",
            "Seeding completed in ",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["migrate"]),
        {
          stdoutIncludes: ["Nothing to migrate"],
        },
      );

      assertCommandOutput(
        await commandRunner(["rollback", "2"]),
        {
          stdoutIncludes: [
            "Starting rollback of 2 files",
            "Rolling back 20210508135213_test3.ts",
            "Done in ",
            "Rolling back 20210508125213_test2.ts",
            "Rollback completed in ",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["status"]),
        {
          stdoutIncludes: [
            "Status",
            "totalAvailableMigrationFiles: 3",
            "completedMigrations: 1",
            "newAvailableMigrations: 2",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["migrate", "2"]),
        {
          stdoutIncludes: [
            "Starting migration of 2 files",
            "Migrating 20210508125213_test2.ts",
            "Done in ",
            "Migrating 20210508135213_test3.ts",
            "Migrations completed in ",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["status"]),
        {
          stdoutIncludes: [
            "Status",
            "totalAvailableMigrationFiles: 3",
            "completedMigrations: 3",
            "newAvailableMigrations: 0",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["rollback", "all"]),
        {
          stdoutIncludes: [
            "Starting rollback of 3 files",
            "Done in",
            "Rolling back 20210508135213_test3.ts",
            "Rolling back 20210508125213_test2.ts",
            "Rolling back 20210508115213_test1.ts",
            "Rollback completed in ",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["status"]),
        {
          stdoutIncludes: [
            "Status",
            "totalAvailableMigrationFiles: 3",
            "completedMigrations: 0",
            "newAvailableMigrations: 3",
          ],
        },
      );

      assertCommandOutput(
        await commandRunner(["rollback"]),
        {
          stdoutIncludes: ["Nothing to rollback"],
        },
      );
    }

    it("command flow Postgres", async () => {
      await commandFlowTest(DbDialects.Postgres);
    });

    it("command flow MySql", async () => {
      await commandFlowTest(DbDialects.MySql);
    });

    it("command flow SqLite", async () => {
      await commandFlowTest(DbDialects.SqLite);
    });
  });
});
