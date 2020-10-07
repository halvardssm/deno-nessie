import { ClientSQLite } from "../clients/ClientSQLite.ts";
import type { ClientOptions } from "../types.ts";

const clientConfig: ClientOptions = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};

const dbFile = "./sqlite.db";

export default {
  client: new ClientSQLite(clientConfig, dbFile),
};
