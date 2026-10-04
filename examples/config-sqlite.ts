import type { NessieConfig } from "../mod.ts";
import { SqliteClient } from "../clients/sqlite.ts";

const client = new SqliteClient("./sqlite.db");

const config: NessieConfig = {
  client,
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
