import { ClientMySQL } from "../../../../mod.ts";

export const dbConnection = {
  "hostname": "0.0.0.0",
  "port": 5001,
  "username": "root",
  "db": "nessie",
};

export default {
  client: new ClientMySQL(dbConnection),
  migrationFolders: ["./tests/integration/update_timestamps"],
  seedFolders: ["./tests/integration/update_timestamps"],
};
