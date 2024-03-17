import { NessieConfig, SqLiteMigrationClient } from "../mod.ts";

const config: NessieConfig = {
  client: new SqLiteMigrationClient("sqlite.db"),
  additionalMigrationFiles: ["https://example.com/some_migration_file.ts"],
};

export default config;
