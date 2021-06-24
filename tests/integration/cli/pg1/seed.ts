import { AbstractSeed, ClientPostgreSQL, Info } from "../../../../mod.ts";

export default class extends AbstractSeed<ClientPostgreSQL> {
  async run({ dialect }: Info): Promise<void> {
    await this.client.queryArray("INSERT INTO testTable1 VALUES (1234)");
  }
}
