import { ClientMySQL } from "../clients/ClientMySQL.ts";

const migrationFolder = "./migrations";

export default {
  client: new ClientMySQL(migrationFolder, {
    hostname: "localhost",
    port: 3306,
    username: "root",
    db: "nessie",
  }),
};
