import type { Migration } from "../../mod.ts";
import type { Schema } from "../../qb.ts";

export const up: Migration<Schema> = ({ queryBuilder }) => {
  return queryBuilder!.create("basics", (table) => {
    table.id();
    table.string("col_1", 10);
    table.timestamps();
    table.enum("col_11", ["enum_1", "enum_2"]);
  });
};

export const down: Migration<Schema> = ({ queryBuilder }) => {
  return queryBuilder!.drop("basics");
};
