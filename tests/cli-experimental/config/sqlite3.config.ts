import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite(
    {
      migrationFolders: [
        "./tests/cli-experimental/sqlite31",
        "./tests/cli-experimental/sqlite32",
      ],
      seedFolders: [
        "./tests/cli-experimental/sqlite31",
        "./tests/cli-experimental/sqlite32",
      ],
    },
    "./tests/data/sqlite.db",
  ),
  experimental: true,
  useDateTime: true,
};
