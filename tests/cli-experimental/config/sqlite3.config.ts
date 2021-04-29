import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite(
    {
      migrationFolder: "./tests/cli-experimental/sqlite3",
      seedFolder: "./tests/cli-experimental/sqlite3",
      experimental: true,
    },
    "./tests/data/sqlite.db",
  ),
};
