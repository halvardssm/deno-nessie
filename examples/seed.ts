import { AbstractSeed, Context, PostgresMigrationClient } from "../mod.ts";

export default class extends AbstractSeed<PostgresMigrationClient> {
  async run(_ctx: Context): Promise<void> {
    await this.client.queryArray("INSERT INTO table1 VALUES (1234)");
  }
}
