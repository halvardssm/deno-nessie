import { AbstractSeed, ClientMySQL, Info } from "../../../mod.ts";

export default class ExperimentalSeed extends AbstractSeed<ClientMySQL> {
  async run({ dialect }: Info): Promise<void> {
    await this.client.query("INSERT INTO testTable1 VALUES (1234)");
  }
}
