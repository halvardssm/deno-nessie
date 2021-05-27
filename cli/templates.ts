import { DB_CLIENTS, DB_DIALECTS, URL_BASE_VERSIONED } from "../consts.ts";
import { DBDialects } from "../types.ts";

export function getConfigTemplate(dialect?: DBDialects) {
  let client: string;
  let importString: string;

  if (dialect === DB_DIALECTS.PGSQL) {
    client = `const client = new ClientPostgreSQL({
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
});`;
    importString = `import {
    ClientPostgreSQL,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
  } else if (dialect === DB_DIALECTS.MYSQL) {
    client = `const client = new ClientMySQL({
    hostname: "localhost",
    port: 3306,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
});`;
    importString = `import {
    ClientMySQL,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
  } else if (dialect === DB_DIALECTS.SQLITE) {
    client = `const client = new ClientSQLite("./sqlite.db");`;
    importString = `import {
    ClientSQLite,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
  } else {
    client = `/** Select one of the supported clients */
// const client = new ClientPostgreSQL({
//     database: "nessie",
//     hostname: "localhost",
//     port: 5432,
//     user: "root",
//     password: "pwd",
// });

// const client = new ClientMySQL({
//     hostname: "localhost",
//     port: 3306,
//     username: "root",
//     // password: "pwd", // uncomment this line for <8
//     db: "nessie",
// });

// const client = new ClientSQLite("./sqlite.db");`;
    importString = `import {
    ClientMySQL,
    ClientPostgreSQL,
    ClientSQLite,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
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

export function getMigrationTemplate(dialect?: DBDialects) {
  let generic;

  if (dialect && dialect in DB_CLIENTS) {
    generic = DB_CLIENTS[dialect as DB_DIALECTS];
  }

  return `import { AbstractMigration, Info${
    generic ? `, ${generic}` : ""
  } } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractMigration${generic ? `<${generic}>` : ""} {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
}

export function getSeedTemplate(dialect?: DBDialects) {
  let generic;

  if (dialect && dialect in DB_CLIENTS) {
    generic = DB_CLIENTS[dialect as DB_DIALECTS];
  }

  return `import { AbstractSeed, Info${
    generic ? `, ${generic}` : ""
  } } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractSeed${generic ? `<${generic}>` : ""} {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
}
