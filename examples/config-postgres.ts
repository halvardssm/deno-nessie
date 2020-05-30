import { ClientPostgreSQL } from "../clients/ClientPostgreSQL.ts";

const migrationFolder = "./migrations";

export default {
  client: new ClientPostgreSQL(migrationFolder, {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  }),
};
