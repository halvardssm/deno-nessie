import { NessieConfig, SqLiteMigrationClient } from "../mod.ts";

const config: NessieConfig = {
  client: new SqLiteMigrationClient({ client: ["./sqlite.db"] }),
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
