import { AbstractSeed, Info, ClientPostgreSQL as Client } from "../../mod.ts";

export default class ExperimentalSeed extends AbstractSeed<Client> {
  async run({ dialect }: Info): Promise<void> {
    await this.client.query("INSERT INTO table1 VALUES (1234)");
  }
}
