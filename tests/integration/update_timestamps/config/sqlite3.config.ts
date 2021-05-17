import { ClientSQLite } from "../../../../mod.ts";

export const dbConnection = "./tests/data/sqlite.db";

export default {
  client: new ClientSQLite(dbConnection),
  migrationFolders: ["./tests/integration/update_timestamps"],
  seedFolders: ["./tests/integration/update_timestamps"],
};
