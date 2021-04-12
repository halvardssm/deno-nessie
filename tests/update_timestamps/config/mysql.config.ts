import { ClientMySQL } from "../../../mod.ts";

export const dbConnection = {
  "hostname": "0.0.0.0",
  "port": 5001,
  "username": "root",
  "db": "nessie",
};

export default {
  client: new ClientMySQL(
    {
      migrationFolder: "./tests/update_timestamps",
      seedFolder: "./tests/update_timestamps",
      experimental: true,
    },
    dbConnection,
  ),
};
