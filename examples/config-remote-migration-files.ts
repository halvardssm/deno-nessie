import { ClientSQLite, NessieConfig } from "https://deno.land/x/nessie/mod.ts";

const config: NessieConfig = {
  client: new ClientSQLite("sqlite.db"),
  additionalMigrationFiles: ["https://example.com/some_migration_file.ts"],
};

export default config;
