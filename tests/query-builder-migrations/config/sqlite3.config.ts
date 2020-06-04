import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite(
    { migrationFolder: "./tests/query-builder-migrations" },
    "./tests/data/sqlite.db",
  ),
};
