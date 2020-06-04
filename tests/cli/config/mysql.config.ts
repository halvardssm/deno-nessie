import { ClientMySQL } from "../../../mod.ts";

export default {
  client: new ClientMySQL(
    { migrationFolder: "./tests/cli", seedFolder: "./tests/cli" },
    {
      "hostname": "localhost",
      "port": 5001,
      "username": "root",
      "db": "nessie",
    },
  ),
};
