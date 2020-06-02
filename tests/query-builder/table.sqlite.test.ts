import { assertEquals } from "../../deps.ts";
import { Table } from "../../qb.ts";

const dialect = "sqlite";

const strings = [
  {
    name: "Standard Table",
    string: new Table("testTable", dialect)
      .toSql(),
    solution: "CREATE TABLE testTable ();",
  },
  {
    name: "Table with custom",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.custom("testCol testType");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol testType);",
  },
  {
    name: "Table with two custom",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.custom("testCol testType");
      table.custom("testCol2 testType2");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol testType, testCol2 testType2);",
  },
  {
    name: "Table with 1 unique",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      table.unique("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol int); CREATE UNIQUE INDEX testTable_testCol ON testTable (testCol);",
  },
  {
    name: "Table with 2 unique",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      table.integer("testCol2");
      table.unique(["testCol", "testCol2"]);
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol int, testCol2 int); CREATE UNIQUE INDEX testTable_testCol_testCol2 ON testTable (testCol, testCol2);",
  },
  {
    name: "Table with 1 primary",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      table.primary("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol int);",
  },
  {
    name: "Table with 2 primary",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      table.integer("testCol2");
      table.primary("testCol", "testCol2");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol int, testCol2 int);",
  },
  {
    name: "Table with 1 index",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      table.index("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol int); CREATE INDEX testTable_testCol ON testTable (testCol);",
  },
  {
    name: "Table with 2 index",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      table.integer("testCol2");
      table.index("testCol");
      table.index("testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol int, testCol2 int); CREATE INDEX testTable_testCol ON testTable (testCol); CREATE INDEX testTable_testCol2 ON testTable (testCol2);",
  },
  {
    name: "Table with 2 index alt",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      table.integer("testCol2");
      table.index("testCol", "testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol int, testCol2 int); CREATE INDEX testTable_testCol ON testTable (testCol); CREATE INDEX testTable_testCol2 ON testTable (testCol2);",
  },
  {
    name: "Table with id",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.id();
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (id bigint PRIMARY KEY);",
  },
  {
    name: "Table with bigIncrements",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.bigIncrements("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol bigint);",
  },
  {
    name: "Table with binary",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.binary("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol blob);",
  },
  {
    name: "Table with boolean",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.boolean("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol boolean);",
  },
  {
    name: "Table with char",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.char("testCol", 1);
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol char (1));",
  },
  {
    name: "Table with createdAt",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.createdAt();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at timestamp (0) DEFAULT current_timestamp);",
  },
  {
    name: "Table with createdAtTz",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.createdAtTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at datetime (0) DEFAULT current_timestamp);",
  },
  {
    name: "Table with date",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.date("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol date);",
  },
  {
    name: "Table with dateTime",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.dateTime("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol timestamp (0));",
  },
  {
    name: "Table with decimal",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.numeric("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol decimal (8, 2));",
  },
  {
    name: "Table with double",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.double("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol double (8, 2));",
  },
  {
    name: "Table with enum",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.enum("testCol", ["one", "two", "three"]);
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol TEXT CHECK(testCol IN ('one', 'two', 'three') ));",
  },
  {
    name: "Table with float",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.real("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol float (8, 2));",
  },
  {
    name: "Table with increments",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.increments("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol int);",
  },
  {
    name: "Table with integer",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.integer("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol int);",
  },
  {
    name: "Table with ipAddress",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.ipAddress("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol varchar (50));",
  },
  {
    name: "Table with json",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.json("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol json);",
  },
  {
    name: "Table with jsonb",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.jsonb("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol json);",
  },
  {
    name: "Table with macAddress",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.macAddress("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol varchar (17));",
  },
  {
    name: "Table with macAddress8",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.macAddress8("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol varchar (23));",
  },
  {
    name: "Table with point",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.point("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol point);",
  },
  {
    name: "Table with polygon",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.polygon("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol polygon);",
  },
  {
    name: "Table with smallIncrements",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.smallIncrements("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol smallint);",
  },
  {
    name: "Table with smallInteger",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.smallInteger("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol smallint);",
  },
  {
    name: "Table with string",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.string("testCol", 1);
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol varchar (1));",
  },
  {
    name: "Table with text",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.text("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol text);",
  },
  {
    name: "Table with time",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.time("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol time (0));",
  },
  {
    name: "Table with timeTz",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.timeTz("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol time (0));",
  },
  {
    name: "Table with timestamp",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.timestamp("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol timestamp (0));",
  },
  {
    name: "Table with timestamp",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.timestampTz("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol datetime (0));",
  },
  {
    name: "Table with timestamps",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.timestamps();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at timestamp (0) DEFAULT current_timestamp, updated_at timestamp (0) DEFAULT current_timestamp); DROP TRIGGER IF EXISTS set_timestamp; CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW BEGIN UPDATE testTable SET updated_at = CURRENT_TIMESTAMP WHERE id=OLD.id\\; END;",
  },
  {
    name: "Table with timestampsTz",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.timestampsTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at datetime (0) DEFAULT current_timestamp, updated_at datetime (0) DEFAULT current_timestamp); DROP TRIGGER IF EXISTS set_timestamp; CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW BEGIN UPDATE testTable SET updated_at = CURRENT_TIMESTAMP WHERE id=OLD.id\\; END;",
  },
  {
    name: "Table with updatedAtTz",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.updatedAtTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (updated_at datetime (0) DEFAULT current_timestamp); DROP TRIGGER IF EXISTS set_timestamp; CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW BEGIN UPDATE testTable SET updated_at = CURRENT_TIMESTAMP WHERE id=OLD.id\\; END;",
  },
  {
    name: "Table with text",
    string: (() => {
      const table = new Table("testTable", dialect);
      table.uuid("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol varchar (36));",
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
