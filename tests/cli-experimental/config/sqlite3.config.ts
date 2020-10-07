import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite(
    {
      migrationFolder: "./tests/cli",
      seedFolder: "./tests/cli",
      experimental: true,
    },
    "./tests/data/sqlite.db",
  ),
};
