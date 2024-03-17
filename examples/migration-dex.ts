import { AbstractMigration, Context, PostgresMigrationClient } from "../mod.ts";
import Dex from "https://deno.land/x/dex/mod.ts";

export default class extends AbstractMigration<PostgresMigrationClient> {
  async up({ dialect }: Context): Promise<void> {
    const query = Dex({ client: dialect }).schema.createTable(
      "test",
      (table: any) => {
        table.bigIncrements("id").primary();
        table.string("file_name", 100).unique();
        table.timestamps(undefined, true);
      },
    );

    await this.client.queryArray(query);

    await this.client.queryArray(
      'insert into test (file_name) values ("test1"), ("test2")',
    );

    const rows = await this.client.query("select * from test");

    for await (const row of rows) {
      this.client.queryArray(
        `update test set file_name = ${
          row.file_name +
          "_some_suffix"
        } where id = ${row.id}`,
      );
    }
  }

  async down({ dialect }: Context): Promise<void> {
    const query = Dex({ client: dialect }).schema.dropTable("test");

    await this.client.queryArray(query);
  }
}
