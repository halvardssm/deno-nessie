import {
  ClientPostgreSQL,
  ClientOptions,
} from "https://deno.land/x/nessie/mod.ts";
import type { ConnectionOptions } from "https://deno.land/x/postgres@v0.4.5/connection_params.ts";

const clientConfig: ClientOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
  experimental: true,
};

const connectionConfig: ConnectionOptions = {
  database: "nessie",
  hostname: "localhost",
  port: 5432,
  user: "root",
  password: "pwd",
};

export default {
  client: new ClientPostgreSQL(clientConfig, connectionConfig),
};
