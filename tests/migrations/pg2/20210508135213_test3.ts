import {
  AbstractMigration,
  Context,
  PostgresMigrationClient,
} from "../../../mod.ts";

export default class extends AbstractMigration<PostgresMigrationClient> {
  async up({ dialect }: Context): Promise<void> {
    await this.client.queryArray("CREATE TABLE testTable3 (id int)");
  }

  async down({ dialect }: Context): Promise<void> {
    await this.client.queryArray("DROP TABLE testTable3");
  }
}
