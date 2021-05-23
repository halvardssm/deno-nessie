import {
  AbstractMigration,
  ClientPostgreSQL,
  Info,
} from "https://deno.land/x/nessie/mod.ts";

export default class extends AbstractMigration<ClientPostgreSQL> {
  async up({ dialect }: Info): Promise<void> {
    await this.client.queryArray("CREATE TABLE table1 (id int)");
  }

  async down({ dialect }: Info): Promise<void> {
    await this.client.queryArray("DROP TABLE table1");
  }
}
