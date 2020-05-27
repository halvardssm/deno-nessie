import { ClientPostgreSQL } from "../../clients/ClientPostgreSQL.ts";
import { ClientMySQL } from "../../clients/ClientMySQL.ts";
import { ClientSQLite } from "../../clients/ClientSQLite.ts";

const migrationFolder = "./migrations"

const configPg = {
  client: new ClientPostgreSQL(migrationFolder, {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  })
};
const configMySql = {
  client: new ClientMySQL(migrationFolder, {
    hostname: "localhost",
    port: 3306,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
  })
};
const configSqLite = {
  client: new ClientSQLite(migrationFolder, "sqlite.db")
};

export default configPg;
