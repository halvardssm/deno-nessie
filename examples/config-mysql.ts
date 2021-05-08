import {
  ClientMySQL,
  ClientOptions,
  NessieConfig,
} from "https://deno.land/x/nessie/mod.ts";
import type { ClientConfig } from "https://deno.land/x/mysql@v2.8.0/mod.ts";

const clientConfig: ClientOptions = {
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

const connectionConfig: ClientConfig = {
  hostname: "localhost",
  port: 3306,
  username: "root",
  db: "nessie",
};

const config: NessieConfig = {
  client: new ClientMySQL(clientConfig, connectionConfig),
  experimental: true,
  useDateTime: true,
};

export default config;
