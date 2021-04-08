import { ClientMySQL } from "../../../mod.ts";

export default {
  client: new ClientMySQL(
    { migrationFolder: "./tests/cli", seedFolder: "./tests/cli" },
    {
      "hostname": "0.0.0.0",
      "port": 5001,
      "username": "root",
      "db": "nessie",
    },
  ),
};
