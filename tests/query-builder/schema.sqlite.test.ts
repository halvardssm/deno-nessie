import { assertEquals } from "../../deps.ts";
import { Schema } from "../../qb.ts";

const dialect = "sqlite";

const strings = [
  {
    name: "Schema create",
    string: (() => {
      const testSchema = new Schema(dialect);
      return testSchema.create("testTable", (table) => {
        table.id();
        table.timestamps();
      });
    })(),
    solution: [
      "CREATE TABLE testTable (id bigint PRIMARY KEY, created_at timestamp (0) default current_timestamp, updated_at timestamp (0) default current_timestamp);",
      "DROP TRIGGER IF EXISTS set_timestamp;",
      "CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW BEGIN UPDATE testTable SET updated_at = CURRENT_TIMESTAMP WHERE id=OLD.id; END;",
    ],
  },
  {
    name: "Schema queryString",
    string: (() => {
      const testSchema = new Schema(dialect);
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
      const testSchema = new Schema(dialect);
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
      const testSchema = new Schema(dialect);
      return testSchema.drop("testTable");
    })(),
    solution: ["DROP TABLE testTable;"],
  },
  {
    name: "Schema drop if exists",
    string: (() => {
      const testSchema = new Schema(dialect);
      return testSchema.drop("testTable", true);
    })(),
    solution: ["DROP TABLE IF EXISTS testTable;"],
  },
  {
    name: "Schema drop cascade",
    string: (() => {
      const testSchema = new Schema(dialect);
      return testSchema.drop("testTable", false, true);
    })(),
    solution: ["DROP TABLE testTable CASCADE;"],
  },
  {
    name: "Schema drop if exists cascade",
    string: (() => {
      const testSchema = new Schema(dialect);
      return testSchema.drop("testTable", true, true);
    })(),
    solution: ["DROP TABLE IF EXISTS testTable CASCADE;"],
  },
  {
    name: "Schema hasTable",
    string: new Schema(dialect).hasTable("testTable"),
    solution:
      "SELECT name FROM sqlite_master WHERE type='table' AND name='testTable';",
  },
];

strings.forEach(({ name, string, solution }) =>
  Deno.test({
    name: "SQLite: " + (name || "Empty"),
    fn(): void {
      assertEquals(string, solution);
    },
  })
);
