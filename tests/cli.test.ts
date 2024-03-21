import { join, resolve } from "@std/path";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { assertCommandOutput, assertFsExists } from "../lib/utils/assert.ts";
import { emptyDirSync } from "@std/fs";
import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertStringIncludes,
} from "@std/assert";
import configFile from "../deno.json" with { type: "json" };

async function commandRunner(options: Deno.CommandOptions) {
  return await new Deno.Command(Deno.execPath(), {
    ...options,
    env: {
      NO_COLOR: "true",
      ...options.env,
    },
  }).output();
}

describe("integration cli", () => {
  describe("flow", () => {
    const fileDir = resolve("./tests/init");
    const migrationDir = join(fileDir, "db/migrations");
    const seedDir = join(fileDir, "db/seeds");

    const argsPre = [
      "run",
      "-A",
      "--unstable-ffi",
      "-c",
      "deno.json",
      "../../cli.ts",
    ];
    async function commandRunnerLocal(args: string[]) {
      return commandRunner({
        args: [
          ...argsPre,
          ...args,
        ],
        cwd: fileDir,
      });
    }

    beforeAll(() => {
      emptyDirSync(fileDir);

      const imports: Record<string, string> = {
        "@halvardm/nessie": "../../mod.ts",
      };

      for (const [key, value] of Object.entries(configFile.imports)) {
        imports[key] = value.startsWith(".") ? join("../..", value) : value;
      }

      Deno.writeTextFileSync(
        join(fileDir, "deno.json"),
        JSON.stringify({ imports }, null, 2),
      );
    });

    it("run init", async () => {
      assertCommandOutput(
        await commandRunnerLocal([
          "init",
        ]),
        {
          stdoutEquals: `Created config file
Created migration folder
Created seed folder
If you are using Nessie commercially, please consider supporting future development.
Give a donation here: https://github.com/halvardssm/deno-nessie`,
        },
      );

      await assertFsExists(join(fileDir, "nessie.config.ts"), { isFile: true });
      await assertFsExists(join(fileDir, "db"), { isDirectory: true });
      await assertFsExists(migrationDir, { isDirectory: true });
      await assertFsExists(seedDir, { isDirectory: true });
      await assertFsExists(join(migrationDir, ".gitkeep"), { isFile: true });
      await assertFsExists(join(seedDir, ".gitkeep"), { isFile: true });

      const configFile = await Deno.readTextFile(
        join(fileDir, "nessie.config.ts"),
      );
      const newConfigFile = configFile.replace(
        "// const client = new SqLiteMigrationClient",
        "const client = new SqLiteMigrationClient",
      );
      await Deno.writeTextFile(
        join(fileDir, "nessie.config.ts"),
        newConfigFile,
      );
    });

    it("run init again", async () => {
      assertCommandOutput(
        await commandRunnerLocal([
          "init",
        ]),
        {
          stdoutEquals: `Config file already exists
Migration folder already exists
Seed folder already exists
If you are using Nessie commercially, please consider supporting future development.
Give a donation here: https://github.com/halvardssm/deno-nessie`,
        },
      );

      await assertFsExists(join(fileDir, "db"), { isDirectory: true });
      await assertFsExists(migrationDir, { isDirectory: true });
      await assertFsExists(seedDir, { isDirectory: true });
      await assertFsExists(join(migrationDir, ".gitkeep"), { isFile: true });
      await assertFsExists(join(seedDir, ".gitkeep"), { isFile: true });
    });

    it("make test", async () => {
      assertCommandOutput(
        await commandRunnerLocal([
          "make",
          "test",
        ]),
        {
          stdoutIncludes: [
            `Created migration`,
            "/tests/init/db/migrations/",
            "_test.ts",
          ],
        },
      );

      const files = [...Deno.readDirSync(migrationDir)].map((f) => f.name).join(
        "\n",
      );

      assertStringIncludes(files, "_test.ts");
    });

    it("make:migration test2", async () => {
      assertCommandOutput(
        await commandRunnerLocal([
          "make:migration",
          "test2",
        ]),
        {
          stdoutIncludes: [
            `Created migration`,
            "/tests/init/db/migrations/",
            "_test2.ts",
          ],
        },
      );

      const files = [...Deno.readDirSync(migrationDir)].map((f) => f.name).join(
        "\n",
      );

      assertStringIncludes(files, "_test.ts");
      assertStringIncludes(files, "_test2.ts");
    });

    it("make:seed test", async () => {
      assertCommandOutput(
        await commandRunnerLocal([
          "make:seed",
          "test",
        ]),
        {
          stdoutIncludes: [`Created seed test.ts at`, `tests/init/db/seeds`],
        },
      );

      const files = [...Deno.readDirSync(seedDir)].map((f) => f.name);

      assertArrayIncludes(files, ["test.ts"]);
    });

    it("make migration custom template", async () => {
      await Deno.writeTextFile(
        join(fileDir, "test-migration-template"),
        "test",
      );

      assertCommandOutput(
        await commandRunnerLocal([
          "make:migration",
          "--migrationTemplate",
          "test-migration-template",
          "test_migration_template",
        ]),
        {
          stdoutIncludes: [
            "Created migration",
            "/tests/init/db/migrations/",
            "_test_migration_template.ts",
          ],
        },
      );

      const files = [...Deno.readDirSync(migrationDir)].map((f) => f.name);
      const file = files.find((f) => f.match(/test_migration_template.ts$/));

      assert(
        file,
        `Migration file was not found, migration files available are: [${
          files.join(",")
        }]`,
      );

      const fileContent = await Deno.readTextFile(join(migrationDir, file));

      assertEquals(fileContent, "test");
    });

    it("make seed custom template", async () => {
      await Deno.writeTextFile(join(fileDir, "test-seed-template"), "test");

      assertCommandOutput(
        await commandRunnerLocal([
          "make:seed",
          "--seedTemplate",
          "test-seed-template",
          "test_seed_template",
        ]),
        {
          stdoutIncludes: [
            "Created seed test_seed_template.ts at",
            "/tests/init/db/seeds",
          ],
        },
      );

      const fileContent = await Deno.readTextFile(
        join(seedDir, "test_seed_template.ts"),
      );

      assertEquals(fileContent, "test");
    });
  });

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
