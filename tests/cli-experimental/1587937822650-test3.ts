import { AbstractMigration, Info } from "../../mod.ts";

export default class ExperimentalMigration extends AbstractMigration {
  async up({ dialect }: Info): Promise<void> {
    this.client.query("CREATE TABLE testTable3 (id int)");
  }

  async down({ dialect }: Info): Promise<void> {
    this.client.query("DROP TABLE testTable3");
  }
}
