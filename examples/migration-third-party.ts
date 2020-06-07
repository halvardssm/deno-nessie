import { Migration } from "https://deno.land/x/nessie/mod.ts";
import Dex from "https://deno.land/x/dex/mod.ts";

export const up: Migration = ({ dialect }) => { // The dialect depends on which client you use in the config file
  return Dex({ client: dialect }).schema.createTable("test", (table: any) => {
    table.bigIncrements("id").primary();
    table.string("file_name", 100).unique();
    table.timestamps(undefined, true);
  });
};

export const down: Migration = ({ dialect }) => {
  return Dex({ client: dialect }).schema.dropTable("test");
};
