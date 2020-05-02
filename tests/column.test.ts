import { assertEquals } from "../deps.ts";
import { Column } from "../mod.ts";

const strings = [
  {
    name: "Standard Column",
    string: new Column("testName", "testType")
      .toSql(),
    solution: "testName testType",
  },
  {
    name: "Column with default",
    string: new Column("testName", "testType")
      .default("testDefault")
      .toSql(),
    solution: "testName testType default testDefault",
  },
  {
    name: "Column with not nullable",
    string: new Column("testName", "testType")
      .notNullable()
      .toSql(),
    solution: "testName testType not null",
  },
  {
    name: "Column with default and not nullable",
    string: new Column("testName", "testType")
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testName testType default testDefault not null",
  },
  {
    name: "Column with nullable",
    string: new Column("testName", "testType")
      .nullable()
      .toSql(),
    solution: "testName testType",
  },
  {
    name: "Column with default and nullable",
    string: new Column("testName", "testType")
      .default("testDefault")
      .nullable()
      .toSql(),
    solution: "testName testType default testDefault",
  },
  {
    name: "Column 1 input",
    string: new Column("testName", "testType", 1)
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testName testType (1) default testDefault not null",
  },
  {
    name: "Column 2 input",
    string: new Column("testName", "testType", 1, 2)
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testName testType (1, 2) default testDefault not null",
  },
  {
    name: "Column with default and nullable",
    string: new Column("testName", "testType", ["one", "two", "three"])
      .default("testDefault")
      .notNullable()
      .toSql(),
    solution: "testName testType (one,two,three) default testDefault not null",
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
