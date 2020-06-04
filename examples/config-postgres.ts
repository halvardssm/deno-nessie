import { ClientPostgreSQL } from "../clients/ClientPostgreSQL.ts";

const clientConfig = {
  migrationFolder: "./tests/cli",
  seedFolder: "./tests/cli",
};

export default {
  client: new ClientPostgreSQL(clientConfig, {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  }),
};
