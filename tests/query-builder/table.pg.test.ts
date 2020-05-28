import { assertEquals } from "../../deps.ts";
import { Table } from "../../qb.ts";

const strings = [
  {
    name: "Standard Table",
    string: new Table("testTable")
      .toSql(),
    solution: "CREATE TABLE testTable ();",
  },
  {
    name: "Table with custom",
    string: (() => {
      const table = new Table("testTable");
      table.custom("testCol testType");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol testType);",
  },
  {
    name: "Table with two custom",
    string: (() => {
      const table = new Table("testTable");
      table.custom("testCol testType");
      table.custom("testCol2 testType2");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol testType, testCol2 testType2);",
  },
  {
    name: "Table with 1 unique",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      table.unique("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol integer); ALTER TABLE testTable ADD UNIQUE (testCol);",
  },
  {
    name: "Table with 2 unique",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      table.integer("testCol2");
      table.unique(["testCol", "testCol2"]);
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol integer, testCol2 integer); ALTER TABLE testTable ADD UNIQUE (testCol, testCol2);",
  },
  {
    name: "Table with 1 primary",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      table.primary("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol integer); ALTER TABLE testTable ADD PRIMARY KEY (testCol);",
  },
  {
    name: "Table with 2 primary",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      table.integer("testCol2");
      table.primary("testCol", "testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol integer, testCol2 integer); ALTER TABLE testTable ADD PRIMARY KEY (testCol, testCol2);",
  },
  {
    name: "Table with 1 index",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      table.index("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol integer); CREATE INDEX ON testTable (testCol);",
  },
  {
    name: "Table with 2 index",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      table.integer("testCol2");
      table.index("testCol");
      table.index("testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol integer, testCol2 integer); CREATE INDEX ON testTable (testCol); CREATE INDEX ON testTable (testCol2);",
  },
  {
    name: "Table with 2 index alt",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      table.integer("testCol2");
      table.index("testCol", "testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (testCol integer, testCol2 integer); CREATE INDEX ON testTable (testCol); CREATE INDEX ON testTable (testCol2);",
  },
  {
    name: "Table with id",
    string: (() => {
      const table = new Table("testTable");
      table.id();
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (id bigserial PRIMARY KEY);",
  },
  {
    name: "Table with bigIncrements",
    string: (() => {
      const table = new Table("testTable");
      table.bigIncrements("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol bigserial);",
  },
  {
    name: "Table with binary",
    string: (() => {
      const table = new Table("testTable");
      table.binary("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol bytea);",
  },
  {
    name: "Table with boolean",
    string: (() => {
      const table = new Table("testTable");
      table.boolean("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol boolean);",
  },
  {
    name: "Table with char",
    string: (() => {
      const table = new Table("testTable");
      table.char("testCol", 1);
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol char (1));",
  },
  {
    name: "Table with createdAt",
    string: (() => {
      const table = new Table("testTable");
      table.createdAt();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at timestamp (0) default current_timestamp);",
  },
  {
    name: "Table with createdAtTz",
    string: (() => {
      const table = new Table("testTable");
      table.createdAtTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at timestamptz (0) default current_timestamp);",
  },
  {
    name: "Table with date",
    string: (() => {
      const table = new Table("testTable");
      table.date("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol date);",
  },
  {
    name: "Table with dateTime",
    string: (() => {
      const table = new Table("testTable");
      table.dateTime("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol timestamp (0));",
  },
  {
    name: "Table with numeric",
    string: (() => {
      const table = new Table("testTable");
      table.numeric("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol numeric (8, 2));",
  },
  {
    name: "Table with double",
    string: (() => {
      const table = new Table("testTable");
      table.double("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol float8);",
  },
  {
    name: "Table with enum",
    string: (() => {
      const table = new Table("testTable");
      table.enum("testCol", ["one", "two", "three"]);
      return table.toSql();
    })(),
    solution:
      "CREATE TYPE testCol AS ENUM ('one', 'two', 'three');CREATE TABLE testTable (testCol testCol);",
  },
  {
    name: "Table with float",
    string: (() => {
      const table = new Table("testTable");
      table.real("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol real);",
  },
  {
    name: "Table with increments",
    string: (() => {
      const table = new Table("testTable");
      table.increments("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol serial);",
  },
  {
    name: "Table with integer",
    string: (() => {
      const table = new Table("testTable");
      table.integer("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol integer);",
  },
  {
    name: "Table with ipAddress",
    string: (() => {
      const table = new Table("testTable");
      table.ipAddress("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol inet);",
  },
  {
    name: "Table with json",
    string: (() => {
      const table = new Table("testTable");
      table.json("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol json);",
  },
  {
    name: "Table with jsonb",
    string: (() => {
      const table = new Table("testTable");
      table.jsonb("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol jsonb);",
  },
  {
    name: "Table with macAddress",
    string: (() => {
      const table = new Table("testTable");
      table.macAddress("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol macaddr);",
  },
  {
    name: "Table with macAddress8",
    string: (() => {
      const table = new Table("testTable");
      table.macAddress8("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol macaddr8);",
  },
  {
    name: "Table with point",
    string: (() => {
      const table = new Table("testTable");
      table.point("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol point);",
  },
  {
    name: "Table with polygon",
    string: (() => {
      const table = new Table("testTable");
      table.polygon("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol polygon);",
  },
  {
    name: "Table with smallIncrements",
    string: (() => {
      const table = new Table("testTable");
      table.smallIncrements("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol smallserial);",
  },
  {
    name: "Table with smallInteger",
    string: (() => {
      const table = new Table("testTable");
      table.smallInteger("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol smallint);",
  },
  {
    name: "Table with string",
    string: (() => {
      const table = new Table("testTable");
      table.string("testCol", 1);
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol varchar (1));",
  },
  {
    name: "Table with text",
    string: (() => {
      const table = new Table("testTable");
      table.text("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol text);",
  },
  {
    name: "Table with time",
    string: (() => {
      const table = new Table("testTable");
      table.time("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol time (0));",
  },
  {
    name: "Table with timeTz",
    string: (() => {
      const table = new Table("testTable");
      table.timeTz("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol timetz (0));",
  },
  {
    name: "Table with timestamp",
    string: (() => {
      const table = new Table("testTable");
      table.timestamp("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol timestamp (0));",
  },
  {
    name: "Table with timestamp",
    string: (() => {
      const table = new Table("testTable");
      table.timestampTz("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol timestamptz (0));",
  },
  {
    name: "Table with timestamps",
    string: (() => {
      const table = new Table("testTable");
      table.timestamps();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at timestamp (0) default current_timestamp, updated_at timestamp (0) default current_timestamp); DROP TRIGGER IF EXISTS set_timestamp on testTable; CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
  },
  {
    name: "Table with timestampsTz",
    string: (() => {
      const table = new Table("testTable");
      table.timestampsTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (created_at timestamptz (0) default current_timestamp, updated_at timestamptz (0) default current_timestamp); DROP TRIGGER IF EXISTS set_timestamp on testTable; CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
  },
  {
    name: "Table with updatedAt",
    string: (() => {
      const table = new Table("testTable");
      table.updatedAt();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (updated_at timestamp (0) default current_timestamp); DROP TRIGGER IF EXISTS set_timestamp on testTable; CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
  },
  {
    name: "Table with updatedAtTz",
    string: (() => {
      const table = new Table("testTable");
      table.updatedAtTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testTable (updated_at timestamptz (0) default current_timestamp); DROP TRIGGER IF EXISTS set_timestamp on testTable; CREATE TRIGGER set_timestamp BEFORE UPDATE ON testTable FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();",
  },
  {
    name: "Table with text",
    string: (() => {
      const table = new Table("testTable");
      table.uuid("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testTable (testCol uuid);",
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
