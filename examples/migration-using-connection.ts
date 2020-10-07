import type { Migration } from "https://deno.land/x/nessie/mod.ts";
import type { Schema } from "https://deno.land/x/nessie/qb.ts";

export const up: Migration<Schema> = async ({ queryBuilder, connection }) => {
  const hasTable = await connection(queryBuilder.hasTable("basics"));
  const hasColumn = await connection(
    queryBuilder.hasColumn("basics", "col_1"),
  );

  // Using Postgres as an example, will differ between clients
  console.log(hasTable.rows[0][0], hasColumn.rows[0][0]);

  if (!hasTable && !hasColumn) {
    queryBuilder.create("basics", (table) => {
      table.boolean("col_1").default("false");
    });
  }

  return queryBuilder.query;
};

export const down: Migration<Schema> = ({ dialect, queryBuilder }) => {
  return queryBuilder.drop("basics");
};
