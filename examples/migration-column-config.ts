import { Schema } from "https://deno.land/x/nessie/mod.ts";

export const up = () => {
  return new Schema().create("column_config", (table) => {
    table.string("name", 100).nullable().default("Deno");
    table.integer("number").default("0").autoIncrement();
    table.boolean("true").custom("default true");
  });
};

export const down = () => {
  return new Schema().drop("column_config");
};
