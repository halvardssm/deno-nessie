import { ClientPostgreSQL, PGClientConfig } from "../../../mod.ts";

export const dbConnection: PGClientConfig = {
  "database": "nessie",
  "hostname": "0.0.0.0",
  "port": 5000,
  "user": "root",
  "password": "pwd",
};

export default {
  client: new ClientPostgreSQL(
    {
      migrationFolder: "./tests/update_timestamps",
      seedFolder: "./tests/update_timestamps",
      experimental: true,
    },
    dbConnection,
  ),
};
