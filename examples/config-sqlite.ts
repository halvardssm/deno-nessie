import { ClientSQLite } from "../clients/ClientSQLite.ts";

const clientConfig = {
  migrationFolder: "./db/migrations",
  seedFolder: "./db/seeds",
};
const dbFile = "./sqlite.db";

export default {
  client: new ClientSQLite(clientConfig, dbFile),
};
