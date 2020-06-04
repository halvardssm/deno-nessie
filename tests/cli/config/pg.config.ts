import { ClientPostgreSQL } from "../../../mod.ts";

export default {
  client: new ClientPostgreSQL(
    { migrationFolder: "./tests/cli", seedFolder: "./tests/cli" },
    {
      "database": "nessie",
      "hostname": "localhost",
      "port": 5000,
      "user": "root",
      "password": "pwd",
    },
  ),
};
