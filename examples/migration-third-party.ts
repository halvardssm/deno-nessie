import { Migration } from "https://deno.land/x/nessie/mod.ts";
import Dex from "https://deno.land/x/dex/mod.ts";

export const up: Migration = () => {
  return Dex({ client: "mysql" }).schema.createTable("test", (table: any) => {
    table.bigIncrements("id").primary();
    table.string("file_name", 100).unique();
    table.timestamps(undefined, true);
  });
};

export const down: Migration = () => {
  return Dex({ client: "mysql" }).schema.dropTable("test");
};
