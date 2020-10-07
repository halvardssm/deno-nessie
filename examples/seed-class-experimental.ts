import { AbstractSeed, Info } from "https://deno.land/x/nessie/mod.ts";
import type { Client } from "https://deno.land/x/postgres@v0.4.5/mod.ts";

export default class ExperimentalSeed extends AbstractSeed<Client> {
  async run({ dialect }: Info): Promise<void> {
    this.client.query("INSERT INTO table1 VALUES (1234)");
  }
}
