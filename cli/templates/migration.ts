import { AbstractMigration, Info } from "https://deno.land/x/nessie/mod.ts";
// import Dex from "https://deno.land/x/dex/mod.ts";

export default class extends AbstractMigration {
  /** Runs on migrate */
  async up(info: Info): Promise<void> {
  }

  /** Runs on rollback */
  async down(info: Info): Promise<void> {
  }
}
