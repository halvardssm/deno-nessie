import { assertEquals, assertArrayContains } from "../../deps.ts";
import { Schema } from "../../qb.ts";

const dialect = "mysql";

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
      "CREATE TABLE testTable (id bigint AUTO_INCREMENT PRIMARY KEY, created_at timestamp (0) DEFAULT current_timestamp, updated_at timestamp (0) DEFAULT current_timestamp on update current_timestamp);",
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
    solution: "show tables like 'testTable';",
  },
  {
    name: "Schema rename table",
    string: (() => {
      const testSchema = new Schema(dialect);
      return testSchema.renameTable("testTable", "testTable2");
    })(),
    solution: ["RENAME TABLE testTable TO testTable2;"],
  },
  {
    name: "Schema rename column",
    string: (() => {
      const testSchema = new Schema(dialect);
      return testSchema.renameColumn("testTable", "testCol", "testCol2");
    })(),
    solution: ["ALTER TABLE testTable RENAME COLUMN testCol TO testCol2;"],
  },
  {
    name: "Schema drop column",
    string: (() => {
      const testSchema = new Schema(dialect);
      return testSchema.dropColumn("testTable", "testCol");
    })(),
    solution: ["ALTER TABLE testTable DROP testCol;"],
  },
];

strings.forEach(({ name, string, solution }) =>
  Deno.test({
    name: "MySQL: " + (name || "Empty"),
    fn(): void {
      if (Array.isArray(string)) {
        assertArrayContains(string, solution as string[]);
      }
      assertEquals(string, solution);
    },
  })
);
