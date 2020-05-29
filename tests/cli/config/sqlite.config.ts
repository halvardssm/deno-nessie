import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite("./tests/migrations", "./tests/data/sqlite.db"),
};
