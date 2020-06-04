import { ClientPostgreSQL } from "../clients/ClientPostgreSQL.ts";

const clientConfig = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};
const connectionConfig = {
  database: "nessie",
  hostname: "localhost",
  port: 5432,
  user: "root",
  password: "pwd",
};

export default {
  client: new ClientPostgreSQL(clientConfig, connectionConfig),
};
