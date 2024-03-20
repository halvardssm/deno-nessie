import { NessieConfig, SqLiteMigrationClient } from "../mod.ts";

const config: NessieConfig = {
  client: new SqLiteMigrationClient({ client: ["sqlite.db"] }),
  migrationTemplate: "./migration-template.ts",
  seedTemplate: "./seed-template.ts",
};

export default config;
