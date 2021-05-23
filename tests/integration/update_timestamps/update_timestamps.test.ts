import { assert, assertEquals, fromFileUrl, resolve } from "../../../deps.ts";
import { TABLE_MIGRATIONS } from "../../../consts.ts";
import { Client as MySQL } from "https://deno.land/x/mysql@v2.8.0/mod.ts";
import { Client as PostgreSQL } from "https://deno.land/x/postgres@v0.11.2/mod.ts";
import { DB as SQLite } from "https://deno.land/x/sqlite@v2.3.0/mod.ts";

const emptyMigration =
  `import { AbstractMigration, Info } from "../../../mod.ts";
export default class extends AbstractMigration {
  async up({ dialect }: Info): Promise<void> {
  }
  async down({ dialect }: Info): Promise<void> {
  }
}`;

const DIALECT_PG = "pg";
const DIALECT_MYSQL = "mysql";
const DIALECT_SQLITE = "sqlite3";
const DIALECTS = [
  DIALECT_PG,
  DIALECT_MYSQL,
  DIALECT_SQLITE,
];

const fileDir = resolve(fromFileUrl(import.meta.url), "..");
const decoder = new TextDecoder();

for await (const dialect of DIALECTS) {
  Deno.test({
    name: "Update timestamps " + dialect,
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
      for await (const dirEntry of Deno.readDir(fileDir)) {
        if (dirEntry.isFile && /.+-test\.ts/.test(dirEntry.name)) {
          await Deno.remove(resolve(fileDir, dirEntry.name));
        }
      }

      await Deno.writeTextFile(
        fileDir + "/999999999999-test.ts",
        emptyMigration,
      );
      await Deno.writeTextFile(
        fileDir + "/1000000000000-test.ts",
        emptyMigration,
      );
      await Deno.writeTextFile(
        fileDir + "/1587937822648-test.ts",
        emptyMigration,
      ); //2020-04-26 23:50:22
      await Deno.writeTextFile(
        fileDir + "/9999999999999-test.ts",
        emptyMigration,
      );
      await Deno.writeTextFile(
        fileDir + "/10000000000000-test.ts",
        emptyMigration,
      );

      let hasFailed = false;

      const rMigration = Deno.run({
        cmd: [
          "deno",
          "run",
          "-A",
          "--unstable",
          "cli.ts",
          "migrate",
          "-c",
          `./tests/integration/update_timestamps/config/${dialect}.config.ts`,
          // "-d",
        ],
        stdout: "piped",
      });

      const { code: codeMigration } = await rMigration.status();

      const rawOutputMigration = await rMigration.output();
      rMigration.close();

      const resultMigration = decoder.decode(rawOutputMigration).split("\n");

      if (codeMigration !== 0) {
        resultMigration.push(`Code was ${codeMigration}`);
      }

      hasFailed = resultMigration[resultMigration.length - 1].includes(
        "Code was",
      );

      assert(!hasFailed, resultMigration.join("\n"));

      const r = Deno.run({
        cmd: [
          "deno",
          "run",
          "-A",
          "--unstable",
          "cli.ts",
          "update_timestamps",
          "-c",
          `./tests/integration/update_timestamps/config/${dialect}.config.ts`,
        ],
        stdout: "piped",
      });

      const { code } = await r.status();

      const rawOutput = await r.output();
      r.close();

      const result = decoder.decode(rawOutput).split("\n");

      if (code !== 0) {
        result.push(`Code was ${code}`);
      }

      const expected = [
        "Updated timestamps",
        "1587937822648-test.ts => 20200426235022_test.ts",
        "999999999999-test.ts => 20010909034639_test.ts",
        "1000000000000-test.ts => 20010909034640_test.ts",
      ];

      assertEquals(code, 0, result.join("\n"));

      const missing: string[] = [];

      result
        .filter((el) => el.trim().length > 0 && !el.includes("INFO"))
        .forEach((el) => {
          const exists = expected.some((ell) => ell === el);
          if (!exists) {
            missing.push(el);
          }
        });

      assertEquals(missing.length, 0, missing.join("\n"));

      const configFile = await import(
        "file://" +
          resolve(
            `./tests/integration/update_timestamps/config/${dialect}.config.ts`,
          )
      );
      const { dbConnection } = configFile;

      let client;
      let migrationFilesDb: string[];

      if (dialect === DIALECT_PG) {
        client = new PostgreSQL(dbConnection);
        await client.connect();
        const { rows: migrationFilesDbRaw } = await client.queryObject(
          `SELECT * FROM ${TABLE_MIGRATIONS}`,
        );
        await client.end();
        migrationFilesDb = migrationFilesDbRaw
          .map((el) => el.file_name as string);
      } else if (dialect === DIALECT_MYSQL) {
        client = new MySQL();
        await client.connect(dbConnection);
        const migrationFilesDbRaw = await client.query(
          `SELECT * FROM ${TABLE_MIGRATIONS}`,
        );
        await client.close();
        migrationFilesDb = migrationFilesDbRaw.map((el: any) => el.file_name);
      } else {
        client = new SQLite(dbConnection);
        const migrationFilesDbRaw = [...client.query(
          `SELECT * FROM ${TABLE_MIGRATIONS}`,
        )];
        client.close();
        migrationFilesDb = migrationFilesDbRaw.map((el: any) => el[1]);
      }

      const missingDb: string[] = [];
      const expectedDb = [
        "9999999999999-test.ts",
        "10000000000000-test.ts",
        "20010909014639-test.ts",
        "20010909014640-test.ts",
        "20200426215022-test.ts",
      ];

      migrationFilesDb
        .filter((el) => el.trim().length > 0 && !el.includes("INFO"))
        .forEach((el) => {
          const exists = expectedDb.some((ell) => ell === el);
          if (!exists) {
            missingDb.push(el);
          }
        });

      assertEquals(missingDb.length, 0, missingDb.join("\n"));

      for await (const dirEntry of Deno.readDir(fileDir)) {
        if (dirEntry.isFile && /.+-test\.ts/.test(dirEntry.name)) {
          await Deno.remove(resolve(fileDir, dirEntry.name));
        }
      }
    },
  });
}
