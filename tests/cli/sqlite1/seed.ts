import { AbstractSeed, Context, SqLiteMigrationClient } from "../../../mod.ts";

export default class extends AbstractSeed<SqLiteMigrationClient> {
  async run({ dialect }: Context): Promise<void> {
    await this.client.query("INSERT INTO testTable1 VALUES (1234)");
  }
}
