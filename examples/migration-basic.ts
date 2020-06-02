import { Migration } from "https://deno.land/x/nessie/mod.ts";
import { Schema } from "https://deno.land/x/nessie/qb.ts";

export const up: Migration = () => {
  const schema = new Schema("pg");

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

  return schema.query;
};

export const down: Migration = () => {
  return new Schema("pg").drop("basic");
};
