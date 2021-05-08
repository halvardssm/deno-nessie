import { AbstractSeed, ClientSQLite, Info } from "../../../mod.ts";

export default class ExperimentalSeed extends AbstractSeed<ClientSQLite> {
  async run({ dialect }: Info): Promise<void> {
    await this.client.query("INSERT INTO testTable1 VALUES (1234)");
  }
}
