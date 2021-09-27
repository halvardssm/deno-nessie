import {
  ClientPostgreSQL,
  NessieConfig,
} from "https://deno.land/x/nessie/mod.ts";

const config: NessieConfig = {
  client: new ClientPostgreSQL("postgresql://root:pwd@localhost/nessie"),
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
