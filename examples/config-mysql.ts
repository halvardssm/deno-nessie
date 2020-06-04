import { ClientMySQL } from "../clients/ClientMySQL.ts";

const clientConfig = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};
const connectionConfig = {
  hostname: "localhost",
  port: 3306,
  username: "root",
  db: "nessie",
};

export default {
  client: new ClientMySQL(clientConfig, connectionConfig),
};
