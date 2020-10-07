import type { Migration } from "https://deno.land/x/nessie/mod.ts";
import { Schema } from "https://deno.land/x/nessie/qb.ts";

export const up: Migration = ({ dialect }) => {
  const schema = new Schema(dialect);

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

export const down: Migration = ({ dialect }) => {
  return new Schema(dialect).drop("basic");
};
