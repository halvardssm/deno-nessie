import { ClientSQLite } from "../../../../mod.ts";

export default {
  client: new ClientSQLite("./tests/data/sqlite.db"),
  migrationFolders: [
    "./tests/integration/cli/sqlite1",
    "./tests/integration/cli/sqlite2",
  ],
  seedFolders: [
    "./tests/integration/cli/sqlite1",
    "./tests/integration/cli/sqlite2",
  ],
};
