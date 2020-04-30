import {
  TABLE_MIGRATIONS,
  ClientI,
  QUERY_GET_LATEST,
  filterAndSortFiles,
  traverseAndMigrateFiles,
  traverseAndRollbackFiles,
  queryHandler,
} from "./utils.ts";
import Schema from "../src/Schema.ts";
import { PGClient } from "../deps.ts";
import { State } from "./state.ts";

const QUERY_TRIGGER_UPDATE_AT =
  "CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ language 'plpgsql';";

export class PGSQL implements ClientI {
  private state: State;
  private client: PGClient;

  constructor(state: State, client: PGClient) {
    this.state = state;
    this.client = client;
  }

  async migrate() {
    let files = Array.from(Deno.readDirSync(this.state.migrationFolder));

    this.state.debug(files, "Files in migration folder");

    await this._setupDatabase();

    const result = await this.client.query(QUERY_GET_LATEST);

    this.state.debug(result, "Latest migration");

    files = filterAndSortFiles(files, result.rows?.[0]);

    this.state.debug(files, "Files after filter and sort");

    await traverseAndMigrateFiles(
      this.state,
      files,
      async (query) => await this.client.query(query),
    );
  }

  async rollback() {
    const result = await this.client.query(QUERY_GET_LATEST);

    this.state.debug(result, "Latest migration");

    await traverseAndRollbackFiles(
      this.state,
      result.rows?.[0]?.[0],
      async (query) =>
        await queryHandler(
          query,
          this.state,
          async (query) => await this.client.query(query),
        ),
    );
  }

  async close() {
    await this.client.end();
  }

  private async _setupDatabase() {
    const hasTableString = new Schema(this.state.dialect).hasTable(
      TABLE_MIGRATIONS,
    );

    const hasMigrationTable = await this.client.query(hasTableString);

    this.state.debug(hasMigrationTable, "Has migration table result");

    const migrationTableExists =
      hasMigrationTable.rows[0][0] === TABLE_MIGRATIONS;

    this.state.debug(migrationTableExists, "Migration table exsists");

    if (!migrationTableExists) {
      const schema = new Schema(this.state.dialect);

      await this.client.query(QUERY_TRIGGER_UPDATE_AT);

      let sql = schema.create(TABLE_MIGRATIONS, (table) => {
        table.id();
        table.string("file_name", 100);
        table.createdAt();

        table.unique("file_name");
      });

      await queryHandler(
        sql,
        this.state,
        async (query) => await this.client.query(query),
      );

      console.info("Database setup complete");
    }
  }
}
