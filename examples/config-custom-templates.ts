import { NessieConfig, SqLiteMigrationClient } from "../mod.ts";

const config: NessieConfig = {
  client: new SqLiteMigrationClient("sqlite.db"),
  migrationTemplate: "./migration-template.ts",
  seedTemplate: "./seed-template.ts",
};

export default config;
