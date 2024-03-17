import {
  AbstractMigration,
  Context,
  SqLiteMigrationClient,
} from "../../../mod.ts";

export default class extends AbstractMigration<SqLiteMigrationClient> {
  async up({ dialect }: Context): Promise<void> {
    await this.client.query("CREATE TABLE testTable1 (id int)");
  }

  async down({ dialect }: Context): Promise<void> {
    await this.client.query("DROP TABLE testTable1");
  }
}
