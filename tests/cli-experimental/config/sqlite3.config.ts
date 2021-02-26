import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite(
    {
      migrationFolder: "./tests/cli-experimental",
      seedFolder: "./tests/cli-experimental",
      experimental: true,
    },
    "./tests/data/sqlite.db",
  ),
};
