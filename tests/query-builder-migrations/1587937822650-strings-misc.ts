import { Migration, DBDialects } from "../../mod.ts";
import { Schema } from "../../qb.ts";

const dialect = Deno.env.get("DB_DIALECT") as DBDialects;

export const up: Migration = () => {
  return new Schema(dialect).create("strings_misc", (table) => {
    table.increments("col_0");

    table.char("col_1", 10);
    table.string("col_2", 10);
    table.text("col_3");

    table.date("col_4");
    table.dateTime("col_5");
    table.dateTimeTz("col_6");
    table.time("col_7");
    table.timeTz("col_8");
    table.timestamp("col_9");
    table.timestampTz("col_10");
    table.timestampsTz();

    table.ipAddress("col_12");
    table.json("col_13");
    table.jsonb("col_14");
    table.macAddress("col_15");
    table.macAddress8("col_16");
    table.uuid("col_17");
  });
};

export const down: Migration = () => {
  return new Schema(dialect).drop("strings_misc");
};
