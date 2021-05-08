import {
  ClientOptions,
  ClientPostgreSQL,
  NessieConfig,
} from "https://deno.land/x/nessie/mod.ts";
import type { ConnectionOptions } from "https://deno.land/x/postgres@v0.11.2/mod.ts";

const clientConfig: ClientOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};

const connectionConfig: ConnectionOptions = {
  database: "nessie",
  hostname: "localhost",
  port: 5432,
  user: "root",
  password: "pwd",
};

const config: NessieConfig = {
  client: new ClientPostgreSQL(clientConfig, connectionConfig),
  experimental: true,
  useDateTime: true,
};

export default config;
