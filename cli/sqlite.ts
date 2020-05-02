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
import { SQLiteClient, save } from "../deps.ts";
import { State } from "./state.ts";

export class SQLite implements ClientI {
  private state: State;
  private client: SQLiteClient;
  private query: (query: string) => (any[] | undefined)[];

  constructor(state: State, client: SQLiteClient) {
    this.state = state;
    this.client = client;
    this.query = (query: string) => [...client.query(query, [])];
  }

  async migrate() {
    let files = Array.from(Deno.readDirSync(this.state.migrationFolder));

    this.state.debug(files, "Files in migration folder");

    await this._setupDatabase();

    const result = this.query(QUERY_GET_LATEST);

    this.state.debug(result, "Latest migration");

    files = filterAndSortFiles(files, result[0]?.[0]);

    this.state.debug(files, "Files after filter and sort");

    await traverseAndMigrateFiles(
      this.state,
      files,
      async (query) => this.query(query),
    );
  }

  async rollback() {
    const result = this.query(QUERY_GET_LATEST);

    this.state.debug(result, "Latest migration");

    await traverseAndRollbackFiles(
      this.state,
      result[0]?.[0],
      async (query) =>
        await queryHandler(
          query,
          this.state,
          async (query) => this.query(query),
        ),
    );
  }

  async close() {
    await save(this.client);
  }

  private async _setupDatabase() {
    const hasTableString = new Schema(this.state.dialect)
      .hasTable(TABLE_MIGRATIONS);

    const hasMigrationTable = this.query(hasTableString);

    this.state.debug(hasMigrationTable, "Has migration table result");

    const migrationTableExists = hasMigrationTable[0]?.[0] === TABLE_MIGRATIONS;

    this.state.debug(migrationTableExists, "Migration table exsists");

    if (!migrationTableExists) {
      const schema = new Schema(this.state.dialect);

      let sql = schema.create(TABLE_MIGRATIONS, (table) => {
        table.id();
        table.string("file_name", 100);
        table.createdAt();

        table.unique("file_name");
      });

      await queryHandler(
        sql,
        this.state,
        async (query) => this.query(query),
      );

      console.info("Database setup complete");
    }
  }
}
