import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  getConfigTemplate,
  getMigrationTemplate,
  getSeedTemplate,
} from "./templates.ts";
import { DbDialects, MODULE_NAME } from "../mod.ts";

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

    it("pg", () => {
      const expected = `import {
    PostgresMigrationClient,
    NessieConfig,
} from "${MODULE_NAME}";

const client = new PostgresMigrationClient("postgres://root:pwd@localhost:5432/nessie");

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;
      const actual = getConfigTemplate(DbDialects.Postgres);

      assertEquals(actual, expected);
    });

    it("mysql", () => {
      const expected = `import {
    MySqlMigrationClient,
    NessieConfig,
} from "${MODULE_NAME}";

const client = new MySqlMigrationClient("mysql://root@0.0.0.0:3306/nessie");

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;
      const actual = getConfigTemplate(DbDialects.MySql);

      assertEquals(actual, expected);
    });

    it("sqlite", () => {
      const expected = `import {
    SqLiteMigrationClient,
    NessieConfig,
} from "${MODULE_NAME}";

const client = new SqLiteMigrationClient("./sqlite.db");

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;
      const actual = getConfigTemplate(DbDialects.SqLite);

      assertEquals(actual, expected);
    });
  });

  describe("getMigrationTemplate", () => {
    it("standard", () => {
      const expected =
        `import { AbstractMigration, Info } from "${MODULE_NAME}";

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
    it("pg", () => {
      const expected =
        `import { AbstractMigration, Info, PostgresMigrationClient } from "${MODULE_NAME}";

export default class extends AbstractMigration<PostgresMigrationClient> {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
      const actual = getMigrationTemplate(DbDialects.Postgres);

      assertEquals(actual, expected);
    });
    it("mysql", () => {
      const expected =
        `import { AbstractMigration, Info, MySqlMigrationClient } from "${MODULE_NAME}";

export default class extends AbstractMigration<MySqlMigrationClient> {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
      const actual = getMigrationTemplate(DbDialects.MySql);

      assertEquals(actual, expected);
    });
    it("sqlite", () => {
      const expected =
        `import { AbstractMigration, Info, SqLiteMigrationClient } from "${MODULE_NAME}";

export default class extends AbstractMigration<SqLiteMigrationClient> {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
      const actual = getMigrationTemplate(DbDialects.SqLite);

      assertEquals(actual, expected);
    });
  });

  describe("getSeedTemplate", () => {
    it("standard", () => {
      const expected = `import { AbstractSeed, Info } from "${MODULE_NAME}";

export default class extends AbstractSeed {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
      const actual = getSeedTemplate();

      assertEquals(actual, expected);
    });
    it("pg", () => {
      const expected =
        `import { AbstractSeed, Info, PostgresMigrationClient } from "${MODULE_NAME}";

export default class extends AbstractSeed<PostgresMigrationClient> {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
      const actual = getSeedTemplate(DbDialects.Postgres);

      assertEquals(actual, expected);
    });
    it("mysql", () => {
      const expected =
        `import { AbstractSeed, Info, MySqlMigrationClient } from "${MODULE_NAME}";

export default class extends AbstractSeed<MySqlMigrationClient> {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
      const actual = getSeedTemplate(DbDialects.MySql);

      assertEquals(actual, expected);
    });
    it("sqlite", () => {
      const expected =
        `import { AbstractSeed, Info, SqLiteMigrationClient } from "${MODULE_NAME}";

export default class extends AbstractSeed<SqLiteMigrationClient> {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
      const actual = getSeedTemplate(DbDialects.SqLite);

      assertEquals(actual, expected);
    });
  });
});
