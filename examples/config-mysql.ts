import { ClientMySQL } from "../clients/ClientMySQL.ts";

const clientConfig = {
  migrationFolder: "./tests/cli",
  seedFolder: "./tests/cli",
};

export default {
  client: new ClientMySQL(clientConfig, {
    hostname: "localhost",
    port: 3306,
    username: "root",
    db: "nessie",
  }),
};
