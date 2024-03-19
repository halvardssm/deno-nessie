import { join, resolve } from "@std/path";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { assertCommandOutput } from "../lib/utils/assert.ts";
import { emptyDirSync, ensureDirSync } from "@std/fs";

async function commandRunner(options: Deno.CommandOptions) {
  return await new Deno.Command(Deno.execPath(), options).output();
}

describe("integration cli", () => {
  describe("migrations", () => {
    const fileDir = resolve("./tests/migrations");

    async function commandFlowTest(dialect: "pg" | "mysql" | "sqlite") {
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

      async function commandRunnerLocal(args: string[]) {
        return commandRunner({
          args: [
            ...argsPre,
            ...args,
            ...argsPost,
          ],
        });
      }

      assertCommandOutput(
        await commandRunnerLocal(["status", "--file-names"]),
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
        await commandRunnerLocal(["status", "--output=json"]),
        {
          stdoutIncludes:
            `{"totalAvailableMigrationFiles":3,"completedMigrations":0,"newAvailableMigrations":3}`,
        },
      );

      assertCommandOutput(
        await commandRunnerLocal(["status", "--file-names", "--output=json"]),
        {
          stdoutIncludes:
            `{"totalAvailableMigrationFiles":3,"completedMigrations":0,"newAvailableMigrations":3,"totalAvailableMigrationFileNames":["20210508115213_test1.ts","20210508125213_test2.ts","20210508135213_test3.ts"],"completedMigrationNames":[],"newAvailableMigrationNames":["20210508115213_test1.ts","20210508125213_test2.ts","20210508135213_test3.ts"]}`,
        },
      );

      assertCommandOutput(
        await commandRunnerLocal(["status"]),
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
        await commandRunnerLocal(["rollback", "all"]),
        {
          stdoutIncludes: ["Nothing to rollback"],
        },
      );

      assertCommandOutput(
        await commandRunnerLocal(["migrate", "1"]),
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
        await commandRunnerLocal(["status"]),
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
        await commandRunnerLocal(["migrate"]),
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
        await commandRunnerLocal(["status"]),
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
        await commandRunnerLocal(["seed", "seed.ts"]),
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
        await commandRunnerLocal(["migrate"]),
        {
          stdoutIncludes: ["Nothing to migrate"],
        },
      );

      assertCommandOutput(
        await commandRunnerLocal(["rollback", "2"]),
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
        await commandRunnerLocal(["status"]),
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
        await commandRunnerLocal(["migrate", "2"]),
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
        await commandRunnerLocal(["status"]),
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
        await commandRunnerLocal(["rollback", "all"]),
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
        await commandRunnerLocal(["status"]),
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
        await commandRunnerLocal(["rollback"]),
        {
          stdoutIncludes: ["Nothing to rollback"],
        },
      );
    }

    it("command flow Postgres", async () => {
      await commandFlowTest("pg");
    });

    it("command flow MySql", async () => {
      await commandFlowTest("mysql");
    });

    it("command flow SqLite", async () => {
      await commandFlowTest("sqlite");
    });
  });
});
