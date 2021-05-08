import {
  ClientOptions,
  ClientSQLite,
  NessieConfig,
} from "https://deno.land/x/nessie/mod.ts";

const clientConfig: ClientOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};

const dbFile = "./sqlite.db";

const config: NessieConfig = {
  client: new ClientSQLite(clientConfig, dbFile),
  experimental: true,
  useDateTime: true,
};

export default config;
