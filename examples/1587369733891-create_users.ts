import { Schema } from "https://deno.land/x/nessie/mod.ts";

export const up = (scema: Schema): void => {
  scema.create("users", (table) => {
    table.id();
    table.string("name", 100).nullable();
    table.boolean("isTrue").default("false");
    table.custom("custom_column int default 1");
    table.timestamps();
  });
};

export const down = (schema: Schema): void => {
  schema.drop("users");
};
