import {
  AbstractMigration,
  ClientPostgreSQL,
  Info,
} from "https://deno.land/x/nessie/mod.ts";
import Dex from "https://deno.land/x/dex/mod.ts";

export default class ExperimentalMigration
  extends AbstractMigration<ClientPostgreSQL> {
  async up({ dialect }: Info): Promise<void> {
    const query = Dex({ client: dialect }).schema.createTable(
      "test",
      (table: any) => {
        table.bigIncrements("id").primary();
        table.string("file_name", 100).unique();
        table.timestamps(undefined, true);
      },
    );

    this.client.queryArray(query);

    this.client.queryArray(
      'insert into test (file_name) values ("test1"), ("test2")',
    );

    const res = await this.client.queryObject("select * from test");

    for await (const row of res) {
      this.client.queryArray(
        `update test set file_name = ${row.file_name +
          "_some_suffix"} where id = ${row.id}`,
      );
    }
  }

  async down({ dialect }: Info): Promise<void> {
    const query = Dex({ client: dialect }).schema.dropTable("test");

    await this.client.queryArray(query);
  }
}
