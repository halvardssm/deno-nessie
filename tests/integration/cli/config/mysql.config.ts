import { ClientMySQL } from "../../../../mod.ts";

export default {
  client: new ClientMySQL({
    "hostname": "0.0.0.0",
    "port": 5001,
    "username": "root",
    "db": "nessie",
  }),
  migrationFolders: [
    "./tests/integration/cli/mysql1",
    "./tests/integration/cli/mysql2",
  ],
  seedFolders: [
    "./tests/integration/cli/mysql1",
    "./tests/integration/cli/mysql2",
  ],
};
