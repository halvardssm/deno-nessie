import { assertEquals } from "../../deps.ts";
import { Schema } from "../../qb.ts";
import { assertArrayContains } from "https://deno.land/std@v0.54.0/testing/asserts.ts";
const strings = [
  {
    name: "Schema create",
    string: (() => {
      const testSchema = new Schema();
      return testSchema.create("testTable", (table) => {
        table.id();
        table.timestamps();
      });
    })(),
    solution: [
      "CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ language 'plpgsql';",
      "CREATE TABLE testTable (id bigserial PRIMARY KEY, created_at timestamp (0) default current_timestamp, updated_at timestamp (0) default current_timestamp);",
      "DROP TRIGGER IF EXISTS set_timestamp on testTable;",
      "CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
    ],
  },
  {
    name: "Schema queryString",
    string: (() => {
      const testSchema = new Schema();
      return testSchema.queryString(
        `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE;`,
      );
    })(),
    solution: [
      `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE;`,
    ],
  },
  {
    name: "Schema queryString add ; to the end",
    string: (() => {
      const testSchema = new Schema();
      return testSchema.queryString(
        `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE`,
      );
    })(),
    solution: [
      `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE;`,
    ],
  },
  {
    name: "Schema drop",
    string: (() => {
      const testSchema = new Schema();
      return testSchema.drop("testTable");
    })(),
    solution: "DROP TABLE testTable;",
  },
  {
    name: "Schema drop if exists",
    string: (() => {
      const testSchema = new Schema();
      return testSchema.drop("testTable", true);
    })(),
    solution: "DROP TABLE IF EXISTS testTable;",
  },
  {
    name: "Schema drop cascade",
    string: (() => {
      const testSchema = new Schema();
      return testSchema.drop("testTable", false, true);
    })(),
    solution: "DROP TABLE testTable CASCADE;",
  },
  {
    name: "Schema drop if exists cascade",
    string: (() => {
      const testSchema = new Schema();
      return testSchema.drop("testTable", true, true);
    })(),
    solution: "DROP TABLE IF EXISTS testTable CASCADE;",
  },
  {
    name: "Schema hasTable",
    string: new Schema().hasTable("testTable"),
    solution: "SELECT to_regclass('testTable');",
  },
];

strings.forEach(({ name, string, solution }) =>
  Deno.test({
    name: "PG: " + (name || "Empty"),
    fn(): void {
      if (Array.isArray(string)) assertArrayContains(string, solution as string[])
      assertEquals(string, solution);
    },
  })
);
