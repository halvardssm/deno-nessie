import { ClientSQLite } from "../../../mod.ts";

export default {
  client: new ClientSQLite("./tests/cli", "./tests/data/sqlite.db"),
};
