import { ClientMySQL } from "../../../mod.ts";

export default {
  client: new ClientMySQL(
    {
      migrationFolder: "./tests/cli-experimental",
      seedFolder: "./tests/cli-experimental",
      experimental: true,
    },
    {
      "hostname": "localhost",
      "port": 5001,
      "username": "root",
      "db": "nessie",
    },
  ),
};
