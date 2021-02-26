import { AbstractSeed, ClientPostgreSQL as Client, Info } from "../../mod.ts";

export default class ExperimentalSeed extends AbstractSeed<Client> {
  async run({ dialect }: Info): Promise<void> {
    await this.client.query("INSERT INTO testTable1 VALUES (1234)");
  }
}
