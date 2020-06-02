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
    solution: "testCol testType DEFAULT testDefault",
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
    solution: "testCol testType DEFAULT testDefault NOT NULL",
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
    solution: "testCol testType DEFAULT testDefault",
  },
  {
    name: "Column 1 input",
    string: new Column("testCol", "testType", 1)
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType (1) DEFAULT testDefault NOT NULL",
  },
  {
    name: "Column 2 input",
    string: new Column("testCol", "testType", 1, 2)
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType (1, 2) DEFAULT testDefault NOT NULL",
  },
  {
    name: "Column with default and nullable",
    string: new Column("testCol", "testType", ["one", "two", "three"])
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType (one,two,three) DEFAULT testDefault NOT NULL",
  },
  {
    name: "Column with unsigned",
    string: new Column("testCol", "testType")
      .unsigned()
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType DEFAULT testDefault NOT NULL",
  },
  {
    name: "Column with unsigned mysql",
    string: new Column("testCol", "testType", undefined, undefined, "mysql")
      .unsigned()
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testCol testType UNSIGNED DEFAULT testDefault NOT NULL",
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
