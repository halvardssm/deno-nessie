import { Schema, dbDialects } from "../../qb.ts";

const dialect = Deno.env.get("DB_DIALECT") as dbDialects

export const up = (): string => {
  return new Schema(dialect).create("basics", (table) => {
    table.id();
    table.string("col_1", 10);
    // table.timestamps(); TODO FIX TIMESTAMPS
    table.enum("col_11", ["enum_1", "enum_2"])

    console.log(table.toSql())
  });
};

export const down = (): string => {
  return new Schema(dialect).drop("basics");
};
