import { ClientSQLite } from "../clients/ClientSQLite.ts";

const migrationFolder = "./migrations";
const dbFile = "./sqlite.db";

export default {
  client: new ClientSQLite(migrationFolder, dbFile),
};
