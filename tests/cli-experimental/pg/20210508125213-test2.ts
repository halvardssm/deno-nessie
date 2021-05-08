import { AbstractMigration, ClientPostgreSQL, Info } from "../../../mod.ts";

export default class extends AbstractMigration<ClientPostgreSQL> {
  async up({ dialect }: Info): Promise<void> {
    await this.client.queryArray("CREATE TABLE testTable2 (id int)");
  }

  async down({ dialect }: Info): Promise<void> {
    await this.client.queryArray("DROP TABLE testTable2");
  }
}
