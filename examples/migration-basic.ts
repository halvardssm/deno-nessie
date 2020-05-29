import { Schema } from "https://deno.land/x/nessie/mod.ts";

export const up = (): string => {
  const sql1 = new Schema("pg").create("basic", (table) => {
    table.id();
    table.string("name", 100).nullable();
    table.boolean("is_true").default("false");
    table.custom("custom_column int default 1");
    table.timestamps();
  });

  const sql2 = new Schema("pg").queryString(
    "INSERT INTO users VALUES (DEFAULT, 'Deno', true, 2, DEFAULT, DEFAULT);",
  );

  return sql1 + sql2;
};

export const down = (): string => {
  return new Schema("pg").drop("basic");
};
