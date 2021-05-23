import { AbstractMigration, ClientSQLite, Info } from "../../../../mod.ts";

export default class extends AbstractMigration<ClientSQLite> {
  async up({ dialect }: Info): Promise<void> {
    await this.client.query("CREATE TABLE testTable3 (id int)");
  }

  async down({ dialect }: Info): Promise<void> {
    await this.client.query("DROP TABLE testTable3");
  }
}
