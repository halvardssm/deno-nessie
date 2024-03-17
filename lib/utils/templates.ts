import { DBDialects, DbDialects, MODULE_NAME } from "../mod.ts";

export function getConfigTemplate(dialect?: DBDialects): string {
  let client: string;
  let importString: string;

  if (dialect === DbDialects.Postgres) {
    client =
      `const client = new PostgresMigrationClient("postgres://root:pwd@localhost:5432/nessie");`;
    importString = `import {
    PostgresMigrationClient,
    NessieConfig,
} from "${MODULE_NAME}";`;
  } else if (dialect === DbDialects.MySql) {
    client =
      `const client = new MySqlMigrationClient("mysql://root@0.0.0.0:3306/nessie");`;
    importString = `import {
    MySqlMigrationClient,
    NessieConfig,
} from "${MODULE_NAME}";`;
  } else if (dialect === DbDialects.SqLite) {
    client = `const client = new SqLiteMigrationClient("./sqlite.db");`;
    importString = `import {
    SqLiteMigrationClient,
    NessieConfig,
} from "${MODULE_NAME}";`;
  } else {
    client = `/** Select one of the supported clients */
// const client = new PostgresMigrationClient("postgres://root:pwd@localhost:5432/nessie");

// const client = new MySqlMigrationClient("mysql://root@0.0.0.0:3306/nessie");

// const client = new SqLiteMigrationClient("./sqlite.db");`;
    importString = `import {
    MySqlMigrationClient,
    PostgresMigrationClient,
    SqLiteMigrationClient,
    NessieConfig,
} from "${MODULE_NAME}";`;
  }

  const template = `${importString}

${client}

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;

  return template;
}

export function getMigrationTemplate(dialect?: DBDialects): string {
  return `import { AbstractMigration, Info${
    dialect ? `, ${dialect}MigrationClient` : ""
  } } from "${MODULE_NAME}";

export default class extends AbstractMigration${
    dialect ? `<${dialect}MigrationClient>` : ""
  } {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
}

export function getSeedTemplate(dialect?: DBDialects): string {
  return `import { AbstractSeed, Info${
    dialect ? `, ${dialect}MigrationClient` : ""
  } } from "${MODULE_NAME}";

export default class extends AbstractSeed${
    dialect ? `<${dialect}MigrationClient>` : ""
  } {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
}
