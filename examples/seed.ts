import { Seed } from "https://deno.land/x/nessie/mod.ts";

export const run: Seed = () => {
  return "INSERT INTO table1 VALUES (1234)";
};
