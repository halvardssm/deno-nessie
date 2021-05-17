import { ClientPostgreSQL } from "../../../../mod.ts";

export default {
  client: new ClientPostgreSQL({
    "database": "nessie",
    "hostname": "0.0.0.0",
    "port": 5000,
    "user": "root",
    "password": "pwd",
  }),
  migrationFolders: [
    "./tests/integration/cli/pg1",
    "./tests/integration/cli/pg2",
  ],
  seedFolders: [
    "./tests/integration/cli/pg1",
    "./tests/integration/cli/pg2",
  ],
};
