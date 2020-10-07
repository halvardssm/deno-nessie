import { ClientMySQL } from "../clients/ClientMySQL.ts";
import type { ClientOptions } from "../types.ts";
import type { ClientConfig } from "https://deno.land/x/mysql@v2.4.0/mod.ts";

const clientConfig: ClientOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
  experimental: true,
};

const connectionConfig: ClientConfig = {
  hostname: "localhost",
  port: 3306,
  username: "root",
  db: "nessie",
};

export default {
  client: new ClientMySQL(clientConfig, connectionConfig),
};
