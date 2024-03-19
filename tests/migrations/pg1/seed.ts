import {
  AbstractSeed,
  Context,
  PostgresMigrationClient,
} from "../../../mod.ts";

export default class extends AbstractSeed<PostgresMigrationClient> {
  async run({ dialect }: Context): Promise<void> {
    await this.client.queryArray("INSERT INTO testTable1 VALUES (1234)");
  }
}
