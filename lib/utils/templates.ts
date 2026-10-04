import denoConfig from "../../deno.json" with { type: "json" };

/** The databases `init --dialect` can generate a config file for */
export type TemplateDialect = "sqlite" | "postgres" | "mysql";

const BASE = `jsr:@halvardm/nessie@${denoConfig.version}`;

const CLIENTS: Record<
  TemplateDialect,
  { importLine: string; client: string }
> = {
  sqlite: {
    importLine: `import { SqliteClient } from "${BASE}/clients/sqlite";`,
    client: `const client = new SqliteClient("./sqlite.db");`,
  },
  postgres: {
    importLine: `import { PostgresClient } from "${BASE}/clients/postgres";`,
    client:
      `const client = new PostgresClient("postgres://root:pwd@localhost:5432/nessie");`,
  },
  mysql: {
    importLine: `import { MysqlClient } from "${BASE}/clients/mysql";`,
    client:
      `const client = new MysqlClient("mysql://root:pwd@localhost:3306/nessie");`,
  },
};

/**
 * The content of a new config file, as written by `nessie init`.
 *
 * @param dialect the database to configure a client for. Without one, the
 * file has all the clients, commented out, to choose from.
 * @returns the TypeScript source of the config file
 *
 * @example
 * ```ts
 * import { getConfigTemplate } from "@halvardm/nessie";
 * import { assertStringIncludes } from "@std/assert";
 *
 * assertStringIncludes(getConfigTemplate("sqlite"), "new SqliteClient(");
 * ```
 */
export function getConfigTemplate(dialect?: TemplateDialect): string {
  const selected = dialect ? [CLIENTS[dialect]] : Object.values(CLIENTS);
  const imports = selected.map((c) => c.importLine).join("\n");
  const client = dialect
    ? CLIENTS[dialect].client
    : `/** Select one of the supported clients */\n${
      selected.map((c) => `// ${c.client}`).join("\n")
    }\n// deno-lint-ignore no-explicit-any\nconst client: any = undefined;`;

  return `import type { NessieConfig } from "${BASE}";
${imports}

${client}

/** This is the final config object */
const config: NessieConfig = {
  client,
  migrationFolders: ["./db/migrations"],
  seedFolders: ["./db/seeds"],
};

export default config;
`;
}

/**
 * The content of a new migration file, as written by `nessie make:migration`,
 * unless a custom template is used.
 *
 * @returns the TypeScript source, with empty `up` and `down`
 *
 * @example
 * ```ts
 * import { getMigrationTemplate } from "@halvardm/nessie";
 * import { assertStringIncludes } from "@std/assert";
 *
 * assertStringIncludes(getMigrationTemplate(), "satisfies Migration");
 * ```
 */
export function getMigrationTemplate(): string {
  return `import type { Migration } from "${BASE}";

export default {
  /** Runs on migrate */
  async up({ client, dialect }) {
  },

  /** Runs on rollback */
  async down({ client, dialect }) {
  },
} satisfies Migration;
`;
}

/**
 * The content of a new seed file, as written by `nessie make:seed`, unless a
 * custom template is used.
 *
 * @returns the TypeScript source, with an empty `run`
 */
export function getSeedTemplate(): string {
  return `import type { Seed } from "${BASE}";

export default {
  /** Runs on seed */
  async run({ client, dialect }) {
  },
} satisfies Seed;
`;
}
