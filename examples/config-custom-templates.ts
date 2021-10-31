import { ClientSQLite, NessieConfig } from "https://deno.land/x/nessie/mod.ts";

const config: NessieConfig = {
  client: new ClientSQLite("sqlite.db"),
  migrationTemplate: "./migration-template.ts",
  seedTemplate: "./seed-template.ts",
};

export default config;
