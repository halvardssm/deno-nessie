import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite(
    "./tests/query-builder-migrations",
    "./tests/data/sqlite.db",
  ),
};
