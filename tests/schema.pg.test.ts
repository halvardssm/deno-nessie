import { assertEquals } from "../deps.ts";
import { Schema } from "../mod.ts";

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
    solution:
      "CREATE TABLE testTable (id bigserial PRIMARY KEY, created_at timestamp (0) default current_timestamp, updated_at timestamp (0) default current_timestamp); DROP TRIGGER IF EXISTS set_timestamp on public.testTable; CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.testTable FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
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
      assertEquals(string, solution);
    },
  })
);
