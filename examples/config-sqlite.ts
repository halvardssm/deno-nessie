import { ClientSQLite } from "../clients/ClientSQLite.ts";

const clientConfig = {
  migrationFolder: "./tests/cli",
  seedFolder: "./tests/cli",
};
const dbFile = "./sqlite.db";

export default {
  client: new ClientSQLite(clientConfig, dbFile),
};
