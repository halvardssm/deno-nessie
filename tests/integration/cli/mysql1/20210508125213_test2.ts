import { AbstractMigration, ClientMySQL, Info } from "../../../../mod.ts";

export default class extends AbstractMigration<ClientMySQL> {
  async up({ dialect }: Info): Promise<void> {
    await this.client.query("CREATE TABLE testTable2 (id int)");
  }

  async down({ dialect }: Info): Promise<void> {
    await this.client.query("DROP TABLE testTable2");
  }
}
