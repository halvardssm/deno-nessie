import { AbstractSeed, Context, MySqlMigrationClient } from "../../../mod.ts";

export default class extends AbstractSeed<MySqlMigrationClient> {
  async run({ dialect }: Context): Promise<void> {
    await this.client.query("INSERT INTO testTable1 VALUES (1234)");
  }
}
