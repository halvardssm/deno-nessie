import {
  ClientMySQL,
  ClientOptions,
  ClientPostgreSQL,
  ClientSQLite,
} from "https://deno.land/x/nessie/mod.ts";

/** These are the default config options. */
const clientOptions: ClientOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
  experimental: true,
};

/** Select one of the supported clients */
const clientPg = new ClientPostgreSQL(clientOptions, {
  database: "nessie",
  hostname: "localhost",
  port: 5432,
  user: "root",
  password: "pwd",
});

const clientMySql = new ClientMySQL(clientOptions, {
  hostname: "localhost",
  port: 3306,
  username: "root",
  // password: "pwd", // uncomment this line for <8
  db: "nessie",
});

const clientSqLite = new ClientSQLite(clientOptions, "./sqlite.db");

/** This is the final config object */
const config = {
  client: clientPg,
  // Defaults to false, if you want the query builder exposed in migration files, set this to true.
  exposeQueryBuilder: false,
};

export default config;
