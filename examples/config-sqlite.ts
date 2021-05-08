import {
  ClientOptions,
  ClientSQLite,
  NessieConfig,
} from "https://deno.land/x/nessie/mod.ts";

const clientConfig: ClientOptions = {
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

const dbFile = "./sqlite.db";

const config: NessieConfig = {
  client: new ClientSQLite(clientConfig, dbFile),
  experimental: true,
  useDateTime: true,
};

export default config;
