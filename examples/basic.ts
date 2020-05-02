import { Schema } from "https://deno.land/x/nessie/mod.ts";

export const up = (schema: Schema): void => {
  schema.create("basic", (table) => {
    table.id();
    table.string("name", 100).nullable();
    table.boolean("is_true").default("false");
    table.custom("custom_column int default 1");
    table.timestamps();
  });

  schema.queryString(
    "INSERT INTO users VALUES (DEFAULT, 'Deno', true, 2, DEFAULT, DEFAULT);",
  );
};

export const down = (schema: Schema): void => {
  schema.drop("basic");
};
