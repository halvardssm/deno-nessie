import { ClientPostgreSQL } from "https://deno.land/x/nessie/mod.ts";
import { ClientMySQL } from "https://deno.land/x/nessie/mod.ts";
import { ClientSQLite } from "https://deno.land/x/nessie/mod.ts";

const clientOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};

const configPg = {
  client: new ClientPostgreSQL(clientOptions, {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  }),
};
const configMySql = {
  client: new ClientMySQL(clientOptions, {
    hostname: "localhost",
    port: 3306,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
  }),
};
const configSqLite = {
  client: new ClientSQLite(clientOptions, "./sqlite.db"),
};

export default configPg;
