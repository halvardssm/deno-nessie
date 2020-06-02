import { ClientPostgreSQL } from "https://deno.land/x/nessie/mod.ts";
import { ClientMySQL } from "https://deno.land/x/nessie/mod.ts";
import { ClientSQLite } from "https://deno.land/x/nessie/mod.ts";

const migrationFolder = "./migrations";

const configPg = {
  client: new ClientPostgreSQL(migrationFolder, {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  }),
};
const configMySql = {
  client: new ClientMySQL(migrationFolder, {
    hostname: "localhost",
    port: 3306,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
  }),
};
const configSqLite = {
  client: new ClientSQLite(migrationFolder, "./sqlite.db"),
};

export default configPg;
