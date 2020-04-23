import { Schema } from "https://deno.land/x/nessie/mod.ts";

export const up = (scema: Schema): void => {
  scema.create("column_config", (table) => {
    table.string("name", 100).nullable().default("Deno");
    table.integer("number").default("0").autoIncrement();
    table.boolean("true").custom("default true");
  });
};

export const down = (schema: Schema): void => {
  schema.drop("column_config");
};
