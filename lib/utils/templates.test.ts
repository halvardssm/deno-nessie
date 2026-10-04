import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  getConfigTemplate,
  getMigrationTemplate,
  getSeedTemplate,
} from "./templates.ts";

Deno.test("config template per dialect", () => {
  const sqlite = getConfigTemplate("sqlite");
  assertStringIncludes(sqlite, "new SqliteClient(");
  assertEquals(sqlite.includes("PostgresClient"), false);
  assertStringIncludes(getConfigTemplate("postgres"), "new PostgresClient(");
  assertStringIncludes(getConfigTemplate("mysql"), "new MysqlClient(");
});

Deno.test("config template without dialect lists all clients", () => {
  const template = getConfigTemplate();
  for (const name of ["SqliteClient", "PostgresClient", "MysqlClient"]) {
    assertStringIncludes(template, name);
  }
});

Deno.test("migration and seed templates", () => {
  assertStringIncludes(getMigrationTemplate(), "satisfies Migration");
  assertStringIncludes(getMigrationTemplate(), "async up(");
  assertStringIncludes(getMigrationTemplate(), "async down(");
  assertStringIncludes(getSeedTemplate(), "satisfies Seed");
  assertStringIncludes(getSeedTemplate(), "async run(");
});
