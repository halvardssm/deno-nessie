import { ClientPostgreSQL } from "../../../../mod.ts";

export const dbConnection = {
  "database": "nessie",
  "hostname": "0.0.0.0",
  "port": 5000,
  "user": "root",
  "password": "pwd",
};

export default {
  client: new ClientPostgreSQL(dbConnection),
  migrationFolders: ["./tests/integration/update_timestamps"],
  seedFolders: ["./tests/integration/update_timestamps"],
};
