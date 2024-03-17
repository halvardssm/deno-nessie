import { MySqlMigrationClient, NessieConfig } from "../mod.ts";

const config: NessieConfig = {
  client: new MySqlMigrationClient("mysql://root@localhost:3306/nessie"),
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
