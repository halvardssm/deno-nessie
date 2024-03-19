import {
  AbstractMigration,
  Context,
  MySqlMigrationClient,
} from "../../../mod.ts";

export default class extends AbstractMigration<MySqlMigrationClient> {
  async up({ dialect }: Context): Promise<void> {
    await this.client.query("CREATE TABLE testTable3 (id int)");
  }

  async down({ dialect }: Context): Promise<void> {
    await this.client.query("DROP TABLE testTable3");
  }
}
