import { assertEquals } from "../deps.ts";
import { Table } from "../mod.ts";

const mySqlStrings = [
  {
    name: "Standard Table",
    string: new Table("testName", "mysql")
      .toSql(),
    solution: "CREATE TABLE testName ();",
  },
  {
    name: "Table with custom",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.custom("testName testType");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testName testType);",
  },
  {
    name: "Table with two custom",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.custom("testName testType");
      table.custom("testName2 testType2");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testName testType, testName2 testType2);",
  },
  {
    name: "Table with 1 unique",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      table.unique("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (testCol int); ALTER TABLE testName ADD UNIQUE (testCol);",
  },
  {
    name: "Table with 2 unique",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      table.integer("testCol2");
      table.unique(["testCol", "testCol2"]);
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (testCol int, testCol2 int); ALTER TABLE testName ADD UNIQUE (testCol, testCol2);",
  },
  {
    name: "Table with 1 primary",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      table.primary("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (testCol int); ALTER TABLE testName ADD PRIMARY KEY (testCol);",
  },
  {
    name: "Table with 2 primary",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      table.integer("testCol2");
      table.primary("testCol", "testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (testCol int, testCol2 int); ALTER TABLE testName ADD PRIMARY KEY (testCol, testCol2);",
  },
  {
    name: "Table with 1 index",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      table.index("testCol");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (testCol int); CREATE INDEX ON testName (testCol);",
  },
  {
    name: "Table with 2 index",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      table.integer("testCol2");
      table.index("testCol");
      table.index("testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (testCol int, testCol2 int); CREATE INDEX ON testName (testCol); CREATE INDEX ON testName (testCol2);",
  },
  {
    name: "Table with 2 index alt",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      table.integer("testCol2");
      table.index("testCol", "testCol2");
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (testCol int, testCol2 int); CREATE INDEX ON testName (testCol); CREATE INDEX ON testName (testCol2);",
  },
  {
    name: "Table with id",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.id();
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (id bigint AUTO_INCREMENT PRIMARY KEY);",
  },
  {
    name: "Table with bigIncrements",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.bigIncrements("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol bigint AUTO_INCREMENT);",
  },
  {
    name: "Table with binary",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.binary("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol longblob);",
  },
  {
    name: "Table with boolean",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.boolean("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol tinyint (1));",
  },
  {
    name: "Table with char",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.char("testCol", 1);
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol char (1));",
  },
  {
    name: "Table with createdAt",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.createdAt();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (created_at timestamp (0) default current_timestamp);",
  },
  {
    name: "Table with createdAtTz",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.createdAtTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (created_at timestamptz (0) default current_timestamp);",
  },
  {
    name: "Table with date",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.date("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol date);",
  },
  {
    name: "Table with dateTime",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.dateTime("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol timestamp (0));",
  },
  {
    name: "Table with decimal",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.decimal("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol decimal (8, 2));",
  },
  {
    name: "Table with double",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.double("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol double (8, 2));",
  },
  {
    name: "Table with enum",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.enum("testCol", ["one", "two", "three"]);
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol testCol ENUM(one, two, three));",
  },
  {
    name: "Table with float",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.real("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol float (8, 2));",
  },
  {
    name: "Table with increments",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.increments("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol int AUTO_INCREMENT);",
  },
  {
    name: "Table with integer",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.integer("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol int);",
  },
  {
    name: "Table with ipAddress",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.ipAddress("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol inet);",
  },
  {
    name: "Table with json",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.json("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol json);",
  },
  {
    name: "Table with jsonb",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.jsonb("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol jsonb);",
  },
  {
    name: "Table with macAddress",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.macAddress("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol macaddr);",
  },
  {
    name: "Table with macAddress8",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.macAddress8("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol macaddr8);",
  },
  {
    name: "Table with point",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.point("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol point);",
  },
  {
    name: "Table with polygon",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.polygon("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol polygon);",
  },
  {
    name: "Table with smallIncrements",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.smallIncrements("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol smallint AUTO_INCREMENT);",
  },
  {
    name: "Table with smallInteger",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.smallInteger("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol smallint);",
  },
  {
    name: "Table with string",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.string("testCol", 1);
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol varchar (1));",
  },
  {
    name: "Table with text",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.text("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol longtext);",
  },
  {
    name: "Table with time",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.time("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol time (0));",
  },
  {
    name: "Table with timeTz",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.timeTz("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol timetz (0));",
  },
  {
    name: "Table with timestamp",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.timestamp("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol timestamp (0));",
  },
  {
    name: "Table with timestamp",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.timestampTz("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol timestamptz (0));",
  },
  {
    name: "Table with timestamps",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.timestamps();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (created_at timestamp (0) default current_timestamp, updated_at timestamp (0) default current_timestamp on update current_timestamp);",
  },
  {
    name: "Table with timestampsTz",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.timestampsTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (created_at timestamptz (0) default current_timestamp, updated_at timestamptz (0) default current_timestamp on update current_timestamp);",
  },
  {
    name: "Table with updatedAt mysql",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.updatedAt();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (updated_at timestamp (0) default current_timestamp on update current_timestamp);",
  },
  {
    name: "Table with updatedAtTz",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.updatedAtTz();
      return table.toSql();
    })(),
    solution:
      "CREATE TABLE testName (updated_at timestamptz (0) default current_timestamp on update current_timestamp);",
  },
  {
    name: "Table with text",
    string: (() => {
      const table = new Table("testName", "mysql");
      table.uuid("testCol");
      return table.toSql();
    })(),
    solution: "CREATE TABLE testName (testCol uuid);",
  },
];

mySqlStrings.forEach(({ name, string, solution }) =>
  Deno.test({
    name: "MySQL: " + (name || "Empty"),
    fn(): void {
      assertEquals(string, solution);
    },
  })
);
