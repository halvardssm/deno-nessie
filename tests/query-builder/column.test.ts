import { assertEquals } from "../../deps.ts";
import { Column } from "../../qb.ts";

const strings = [
  {
    name: "Standard Column",
    string: new Column("testCol", "testType")
      .toSql(),
    solution: "testCol testType",
  },
  {
    name: "Column with default",
    string: new Column("testCol", "testType")
      .default("testDefault")
      .toSql(),
    solution: "testCol testType DEFAULT 'testDefault'",
  },
  {
    name: "Column with as a expression default default",
    string: new Column("testCol", "testType")
      .default("nextval('products_product_no_seq')", true)
      .toSql(),
    solution: "testCol testType DEFAULT nextval('products_product_no_seq')",
  },
  {
    name: "Column with null default",
    string: new Column("testCol", "testType")
      .default(null)
      .toSql(),
    solution: "testCol testType DEFAULT NULL",
  },
  {
    name: "Column with boolean default",
    string: new Column("testCol", "testType")
      .default(true)
      .toSql(),
    solution: "testCol testType DEFAULT '1'",
  },
  {
    name: "Column with boolean default",
    string: new Column("testCol", "testType")
      .default(false)
      .toSql(),
    solution: "testCol testType DEFAULT '0'",
  },
  {
    name: "Column with json default",
    string: new Column("testCol", "testType")
      .default({ name: "test name", id: 1 })
      .toSql(),
    solution: `testCol testType DEFAULT '{"name":"test name","id":1}'`,
  },
  {
    name: "Column with number as a default default",
    string: new Column("testCol", "testType")
      .default(12.1)
      .toSql(),
    solution: "testCol testType DEFAULT 12.1",
  },
  {
    name: "Column with default value for a column of enum datatype",
    string: new Column("testCol", "enum")
      .default("firstEnum")
      .toSql(),
    solution: "testCol enum DEFAULT 'firstEnum'",
  },
  {
    name: "Column with default value for a column of text datatype",
    string: new Column("testCol", "testType")
      .default("test default value")
      .toSql(),
    solution: "testCol testType DEFAULT 'test default value'",
  },
  {
    name: "Column with not nullable",
    string: new Column("testCol", "testType")
      .notNullable()
      .toSql(),
    solution: "testCol testType NOT NULL",
  },
  {
    name: "Column with default and not nullable",
    string: new Column("testCol", "testType")
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType DEFAULT 'testDefault' NOT NULL",
  },
  {
    name: "Column with nullable",
    string: new Column("testCol", "testType")
      .nullable()
      .toSql(),
    solution: "testCol testType",
  },
  {
    name: "Column with default and nullable",
    string: new Column("testCol", "testType")
      .default("testDefault")
      .nullable()
      .toSql(),
    solution: "testCol testType DEFAULT 'testDefault'",
  },
  {
    name: "Column 1 input",
    string: new Column("testCol", "testType", 1)
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType (1) DEFAULT 'testDefault' NOT NULL",
  },
  {
    name: "Column 2 input",
    string: new Column("testCol", "testType", 1, 2)
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType (1, 2) DEFAULT 'testDefault' NOT NULL",
  },
  {
    name: "Column with default and nullable",
    string: new Column("testCol", "testType", ["one", "two", "three"])
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType (one,two,three) DEFAULT 'testDefault' NOT NULL",
  },
  {
    name: "Column with unsigned",
    string: new Column("testCol", "testType")
      .unsigned()
      .default(1)
      .notNullable()
      .toSql(),
    solution: "testCol testType DEFAULT 1 NOT NULL",
  },
  {
    name: "Column with unsigned mysql",
    string: new Column("testCol", "testType", undefined, undefined, "mysql")
      .unsigned()
      .default(2)
      .notNullable()
      .toSql(),
    solution: "testCol testType UNSIGNED DEFAULT 2 NOT NULL",
  },
];

strings.forEach(({ name, string, solution }) =>
  Deno.test({
    name: name || "Empty",
    fn(): void {
      assertEquals(string, solution);
    },
  })
);
