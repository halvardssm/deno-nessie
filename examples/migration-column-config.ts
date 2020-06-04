import { Migration } from "https://deno.land/x/nessie/mod.ts";
import { Schema } from "https://deno.land/x/nessie/qb.ts";

export const up: Migration = ({ schema }) => { // If `exposeQueryBuilder: true` in the config file, schema will be exported
  return (schema as Schema).create("column_config", (table) => {
    table.string("name", 100).nullable().default("Deno");
    table.integer("number").default("0").autoIncrement();
    table.boolean("true").custom("default true");
  });
};

export const down: Migration = ({ schema }) => {
  return (schema as Schema).drop("column_config");
};
