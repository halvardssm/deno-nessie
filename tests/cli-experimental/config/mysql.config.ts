import { ClientMySQL } from "../../../mod.ts";

export default {
  client: new ClientMySQL(
    {
      migrationFolders: [
        "./tests/cli-experimental/mysql1",
        "./tests/cli-experimental/mysql2",
      ],
      seedFolders: [
        "./tests/cli-experimental/mysql1",
        "./tests/cli-experimental/mysql2",
      ],
    },
    {
      "hostname": "0.0.0.0",
      "port": 5001,
      "username": "root",
      "db": "nessie",
    },
  ),
  experimental: true,
  useDateTime: true,
};
