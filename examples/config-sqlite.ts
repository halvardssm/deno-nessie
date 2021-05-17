import { ClientSQLite, NessieConfig } from "https://deno.land/x/nessie/mod.ts";

const dbFile = "./sqlite.db";

const config: NessieConfig = {
  client: new ClientSQLite(dbFile),
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
