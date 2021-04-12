import { ClientSQLite } from "../../../mod.ts";

export const dbConnection = "./tests/data/sqlite.db";

export default {
  client: new ClientSQLite(
    {
      migrationFolder: "./tests/update_timestamps",
      seedFolder: "./tests/update_timestamps",
      experimental: true,
    },
    dbConnection,
  ),
};
