import { assertArrayIncludes, assertEquals } from "../../deps.ts";
import { Schema } from "../../qb.ts";

const strings = [
  {
    name: "Schema create",
    string: new Schema().create("testTable", (table) => {
      table.id();
      table.timestamps();
    }),
    solution: [
      "CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ language 'plpgsql';",
      "CREATE TABLE testTable (id bigserial PRIMARY KEY, created_at timestamp (0) DEFAULT current_timestamp, updated_at timestamp (0) DEFAULT current_timestamp);",
      "DROP TRIGGER IF EXISTS set_timestamp on testTable;",
      "CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
    ],
  },
  {
    name: "Schema queryString",
    string: new Schema().queryString(
      `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE;`,
    ),
    solution: [
      `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE;`,
    ],
  },
  {
    name: "Schema queryString add ; to the end",
    string: new Schema().queryString(
      `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE`,
    ),
    solution: [
      `ALTER TABLE child_table ADD CONSTRAINT fk_child_table_parent_table FOREIGN KEY (parent_table_id) REFERENCES parent_table(id) ON DELETE CASCADE;`,
    ],
  },
  {
    name: "Schema drop",
    string: new Schema().drop("testTable"),
    solution: ["DROP TABLE testTable;"],
  },
  {
    name: "Schema drop if exists",
    string: new Schema().drop("testTable", true),
    solution: ["DROP TABLE IF EXISTS testTable;"],
  },
  {
    name: "Schema drop cascade",
    string: new Schema().drop("testTable", false, true),
    solution: ["DROP TABLE testTable CASCADE;"],
  },
  {
    name: "Schema drop if exists cascade",
    string: new Schema().drop("testTable", true, true),
    solution: ["DROP TABLE IF EXISTS testTable CASCADE;"],
  },
  {
    name: "Schema hasTable",
    string: new Schema().hasTable("testTable"),
    solution: "SELECT to_regclass('testTable');",
  },
  {
    name: "Schema rename table",
    string: new Schema().renameTable("testTable", "testTable2"),
    solution: ["ALTER TABLE testTable RENAME TO testTable2;"],
  },
  {
    name: "Schema rename column",
    string: new Schema().renameColumn("testTable", "testCol", "testCol2"),
    solution: ["ALTER TABLE testTable RENAME testCol TO testCol2;"],
  },
  {
    name: "Schema drop column",
    string: new Schema().dropColumn("testTable", "testCol"),
    solution: ["ALTER TABLE testTable DROP testCol;"],
  },
  {
    name: "Schema has column",
    string: new Schema().hasColumn("testTable", "testCol"),
    solution:
      "SELECT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='testTable' and column_name='testCol');",
  },
];

strings.forEach(({ name, string, solution }) =>
  Deno.test({
    name: "PG: " + (name || "Empty"),
    fn(): void {
      if (Array.isArray(string)) {
        assertArrayIncludes(string, solution as string[]);
      }
      assertEquals(string, solution);
    },
  })
);
