import { NessieConfig, PostgresMigrationClient } from "../mod.ts";

const config: NessieConfig = {
  client: new PostgresMigrationClient({
    client: ["postgresql://root:pwd@localhost/nessie"],
  }),
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
