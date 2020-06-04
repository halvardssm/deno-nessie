import { Migration } from "https://deno.land/x/nessie/mod.ts";
import { Schema } from "https://deno.land/x/nessie/qb.ts";
import Dex from "https://deno.land/x/dex/mod.ts";

/** Runs on migrate */
export const up: Migration = () => {
  // return new Schema()
  // return Dex
};

/** Runs on rollback */
export const down: Migration = () => {
};
