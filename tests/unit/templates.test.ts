import { assertEquals } from "../../deps.ts";
import {
  getConfigTemplate,
  getMigrationTemplate,
  getSeedTemplate,
} from "../../cli/templates.ts";
import { DB_DIALECTS, URL_BASE_VERSIONED } from "../../consts.ts";

Deno.test("getConfigTemplate standard", () => {
  const expected = `import {
    ClientMySQL,
    ClientMySQL55,
    ClientPostgreSQL,
    ClientSQLite,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";

/** Select one of the supported clients */
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

// const client = new ClientMySQL55({
//     hostname: "localhost",
//     port: 3306,
//     username: "root",
//     // password: "pwd", // uncomment this line for <8
//     db: "nessie",
// });

// const client = new ClientSQLite("./sqlite.db");

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

Deno.test("getConfigTemplate pg", () => {
  const expected = `import {
    ClientPostgreSQL,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";

const client = new ClientPostgreSQL({
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
});

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;
  const actual = getConfigTemplate(DB_DIALECTS.PGSQL);

  assertEquals(actual, expected);
});

Deno.test("getConfigTemplate mysql", () => {
  const expected = `import {
    ClientMySQL,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";

const client = new ClientMySQL({
    hostname: "localhost",
    port: 3306,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
});

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;
  const actual = getConfigTemplate(DB_DIALECTS.MYSQL);

  assertEquals(actual, expected);
});

Deno.test("getConfigTemplate sqlite", () => {
  const expected = `import {
    ClientSQLite,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";

const client = new ClientSQLite("./sqlite.db");

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;
  const actual = getConfigTemplate(DB_DIALECTS.SQLITE);

  assertEquals(actual, expected);
});

Deno.test("getMigrationTemplate standard", () => {
  const expected =
    `import { AbstractMigration, Info } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractMigration {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
  const actual = getMigrationTemplate();

  assertEquals(actual, expected);
});

Deno.test("getMigrationTemplate pg", () => {
  const expected =
    `import { AbstractMigration, Info, ClientPostgreSQL } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractMigration<ClientPostgreSQL> {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
  const actual = getMigrationTemplate(DB_DIALECTS.PGSQL);

  assertEquals(actual, expected);
});

Deno.test("getMigrationTemplate mysql", () => {
  const expected =
    `import { AbstractMigration, Info, ClientMySQL } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractMigration<ClientMySQL> {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
  const actual = getMigrationTemplate(DB_DIALECTS.MYSQL);

  assertEquals(actual, expected);
});

Deno.test("getMigrationTemplate sqlite", () => {
  const expected =
    `import { AbstractMigration, Info, ClientSQLite } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractMigration<ClientSQLite> {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
  const actual = getMigrationTemplate(DB_DIALECTS.SQLITE);

  assertEquals(actual, expected);
});

Deno.test("getSeedTemplate standard", () => {
  const expected =
    `import { AbstractSeed, Info } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractSeed {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
  const actual = getSeedTemplate();

  assertEquals(actual, expected);
});

Deno.test("getSeedTemplate pg", () => {
  const expected =
    `import { AbstractSeed, Info, ClientPostgreSQL } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractSeed<ClientPostgreSQL> {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
  const actual = getSeedTemplate(DB_DIALECTS.PGSQL);

  assertEquals(actual, expected);
});

Deno.test("getSeedTemplate mysql", () => {
  const expected =
    `import { AbstractSeed, Info, ClientMySQL } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractSeed<ClientMySQL> {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
  const actual = getSeedTemplate(DB_DIALECTS.MYSQL);

  assertEquals(actual, expected);
});

Deno.test("getSeedTemplate sqlite", () => {
  const expected =
    `import { AbstractSeed, Info, ClientSQLite } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractSeed<ClientSQLite> {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
  const actual = getSeedTemplate(DB_DIALECTS.SQLITE);

  assertEquals(actual, expected);
});
