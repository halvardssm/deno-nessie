import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { getConfigTemplate } from "./templates.ts";
import { MODULE_NAME } from "../mod.ts";

describe("unit templates", () => {
  describe("getConfigTemplate", () => {
    it("standard", () => {
      const expected = `import {
  MySqlMigrationClient,
  PostgresMigrationClient,
  SqLiteMigrationClient,
  NessieConfig,
} from "${MODULE_NAME}";

/** Select one of the supported clients */
// const client = new PostgresMigrationClient("postgres://root:pwd@localhost:5432/nessie");
// const client = new MySqlMigrationClient("mysql://root@0.0.0.0:3306/nessie");
// const client = new SqLiteMigrationClient("./sqlite.db");

/** This is the final config object */
const config: NessieConfig = {
  client,
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
`;
      const actual = getConfigTemplate();

      assertEquals(actual, expected);
    });
  });
});
