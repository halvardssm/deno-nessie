import {
  MySqlMigrationClient,
  PostgresMigrationClient,
  SqLiteMigrationClient,
} from "../clients/mod.ts";
import { MODULE_NAME } from "../mod.ts";

export function getConfigTemplate(): string {
  return `import {
  ${MySqlMigrationClient.name},
  ${PostgresMigrationClient.name},
  ${SqLiteMigrationClient.name},
  NessieConfig,
} from "${MODULE_NAME}";

/** Select one of the supported clients */
// const client = new ${PostgresMigrationClient.name}("postgres://root:pwd@localhost:5432/nessie");
// const client = new ${MySqlMigrationClient.name}("mysql://root@0.0.0.0:3306/nessie");
// const client = new ${SqLiteMigrationClient.name}("./sqlite.db");

/** This is the final config object */
const config: NessieConfig = {
  client,
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
`;
}

export function getMigrationTemplate(): string {
  return `import { Context, AbstractMigration } from "${MODULE_NAME}";

export default class extends AbstractMigration {
  /** Runs on migrate */
  async up(_ctx: Context): Promise<void> {
  }

  /** Runs on rollback */
  async down(_ctx: Context): Promise<void> {
  }
}
`;
}

export function getSeedTemplate(): string {
  return `import { Context, AbstractSeed } from "${MODULE_NAME}";

export default class extends AbstractSeed {
    /** Runs on seed */
    async run(_ctx: Context): Promise<void> {
    }
}
`;
}
