import { ClientSQLite } from "../../../../mod.ts";

export default {
  client: new ClientSQLite("./tests/data/sqlite.db"),
  migrationFolders: [
    "./tests/integration/cli/sqlite31",
    "./tests/integration/cli/sqlite32",
  ],
  seedFolders: [
    "./tests/integration/cli/sqlite31",
    "./tests/integration/cli/sqlite32",
  ],
};
