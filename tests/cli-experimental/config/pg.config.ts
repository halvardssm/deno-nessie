import { ClientPostgreSQL } from "../../../mod.ts";

export default {
  client: new ClientPostgreSQL(
    {
      migrationFolders: [
        "./tests/cli-experimental/pg1",
        "./tests/cli-experimental/pg2",
      ],
      seedFolders: [
        "./tests/cli-experimental/pg1",
        "./tests/cli-experimental/pg2",
      ],
    },
    {
      "database": "nessie",
      "hostname": "0.0.0.0",
      "port": 5000,
      "user": "root",
      "password": "pwd",
    },
  ),
  experimental: true,
  useDateTime: true,
};
