import { ClientSQLite, NessieConfig } from "https://deno.land/x/nessie/mod.ts";

const config: NessieConfig = {
  client: new ClientSQLite("./sqlite.db"),
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
