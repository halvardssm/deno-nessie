import { ClientPostgreSQL } from "../../../mod.ts";

export default {
  client: new ClientPostgreSQL(
    {
      migrationFolder: "./tests/cli-experimental/pg",
      seedFolder: "./tests/cli-experimental/pg",
      experimental: true,
    },
    {
      "database": "nessie",
      "hostname": "0.0.0.0",
      "port": 5000,
      "user": "root",
      "password": "pwd",
    },
  ),
};
