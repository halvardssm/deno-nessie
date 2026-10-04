import type { NessieConfig } from "../mod.ts";
import { SqliteClient } from "../clients/sqlite.ts";

/** Migration and seed files can be loaded from anywhere `import()` can reach */
const config: NessieConfig = {
  client: new SqliteClient("./sqlite.db"),
  migrationFolders: ["./db/migrations"],
  additionalMigrationFiles: [
    "https://example.com/migrations/20240101000000_create_users.ts",
  ],
  additionalSeedFiles: ["https://example.com/seeds/users.ts"],
  // Used by `nessie make:migration` and `nessie make:seed`
  migrationTemplate: "./templates/migration.ts.txt",
  seedTemplate: "./templates/seed.ts.txt",
};

export default config;
