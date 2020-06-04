import { ClientPostgreSQL } from "./clients/ClientPostgreSQL.ts";

const nessieOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};

const connectionOptions = {
  database: "nessie",
  hostname: "localhost",
  port: 5000,
  user: "root",
  password: "pwd",
};

export default {
  client: new ClientPostgreSQL(nessieOptions, connectionOptions),
};
