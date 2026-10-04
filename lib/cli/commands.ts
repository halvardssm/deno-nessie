import { format } from "@std/datetime/format";
import { green } from "@std/fmt/colors";
import { exists } from "@std/fs/exists";
import { resolve } from "@std/path";
import { defineCommand, UsageError } from "@stdext/cli";
import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_MIGRATION_FOLDER,
  DEFAULT_SEED_FOLDER,
  REGEXP_FILE_NAME,
} from "../consts.ts";
import type { AmountMigrate, AmountRollback } from "../types.ts";
import { NessieError } from "../utils/errors.ts";
import {
  getConfigTemplate,
  getMigrationTemplate,
  getSeedTemplate,
  type TemplateDialect,
} from "../utils/templates.ts";
import { isMigrationFile, isRemoteUrl, isUrl } from "../utils/utils.ts";
import { loadState, type State } from "./state.ts";
import denoConfig from "../../deno.json" with { type: "json" };

const DIALECTS: TemplateDialect[] = ["sqlite", "postgres", "mysql"];

const common = {
  config: {
    type: "string",
    alias: "c",
    default: `./${DEFAULT_CONFIG_FILE}`,
    description: "Path or URL to the config file.",
  },
  debug: {
    type: "boolean",
    alias: "d",
    description: "Enables verbose output.",
  },
} as const;

const makeOptions = {
  ...common,
  folder: {
    type: "string",
    alias: "f",
    description:
      "The folder to create the file in. Defaults to the first folder in the config.",
  },
  force: {
    type: "boolean",
    description: "Overwrite the file if it already exists.",
  },
} as const;

/** Loads the state, runs the callback and always closes the client */
async function withState(
  flags: { config: string; debug: boolean },
  stdout: (text: string) => void,
  fn: (state: State) => Promise<void>,
  stderr?: (text: string) => void,
) {
  const state = await loadState({ ...flags, info: stdout, warn: stderr });
  try {
    await fn(state);
  } finally {
    await state.config.client.close();
  }
}

function parseAmount(value: string | undefined, allowAll: boolean) {
  if (value === undefined) return undefined;
  if (allowAll && value === "all") return "all" as const;
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new UsageError(
      `--amount must be a whole number${
        allowAll ? " or 'all'" : ""
      }, got '${value}'`,
    );
  }
  return amount;
}

async function readTemplate(path: string): Promise<string> {
  if (isRemoteUrl(path)) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new NessieError(
        `Could not fetch template ${path}: ${response.status}`,
      );
    }
    return await response.text();
  }
  return await Deno.readTextFile(isUrl(path) ? new URL(path) : path);
}

async function makeFile(
  state: State,
  options: {
    kind: "migration" | "seed";
    fileName: string;
    folder: string | undefined;
    force: boolean;
    template: string;
  },
  stdout: (text: string) => void,
) {
  const folders = options.kind === "migration"
    ? state.migrationFolders
    : state.seedFolders;
  const localFolders = folders.filter((folder) => !isUrl(folder));
  const folder = options.folder
    ? resolve(Deno.cwd(), options.folder)
    : localFolders[0];

  if (!folder) throw new NessieError(`No ${options.kind} folder is configured`);
  if (options.folder && !localFolders.includes(folder)) {
    throw new UsageError(
      `'${options.folder}' is not one of the configured ${options.kind} folders: ${
        localFolders.join(", ")
      }`,
    );
  }

  const filePath = resolve(folder, options.fileName);
  if (!options.force && await exists(filePath)) {
    throw new NessieError(
      `The file ${filePath} already exists, use --force to overwrite it`,
    );
  }

  await Deno.writeTextFile(filePath, options.template);
  stdout(`Created ${options.kind} ${filePath}`);
}

const init = defineCommand({
  name: "init",
  description: "Generates the config file and the migration and seed folders.",
  options: {
    mode: {
      type: "string",
      description:
        "What to create: 'config' or 'folders'. Creates both when omitted.",
    },
    dialect: {
      type: "string",
      description: `The database for the config file: ${
        DIALECTS.join(", ")
      }. A general config file is generated when omitted.`,
    },
  },
  async run({ flags, stdout }) {
    if (flags.mode && !["config", "folders"].includes(flags.mode)) {
      throw new UsageError(
        `Mode must be one of 'config' or 'folders', got '${flags.mode}'`,
      );
    }
    if (flags.dialect && !DIALECTS.includes(flags.dialect as TemplateDialect)) {
      throw new UsageError(
        `Dialect must be one of ${DIALECTS.join(", ")}, got '${flags.dialect}'`,
      );
    }

    if (flags.mode !== "folders") {
      const path = resolve(Deno.cwd(), DEFAULT_CONFIG_FILE);
      if (await exists(path)) {
        stdout(green("Config file already exists"));
      } else {
        await Deno.writeTextFile(
          path,
          getConfigTemplate(flags.dialect as TemplateDialect | undefined),
        );
        stdout(green("Created config file"));
      }
    }

    if (flags.mode !== "config") {
      for (
        const [name, folder] of [
          ["Migration", DEFAULT_MIGRATION_FOLDER],
          ["Seed", DEFAULT_SEED_FOLDER],
        ]
      ) {
        const path = resolve(Deno.cwd(), folder);
        if (await exists(path)) {
          stdout(green(`${name} folder already exists`));
        } else {
          await Deno.mkdir(path, { recursive: true });
          await Deno.writeTextFile(resolve(path, ".gitkeep"), "");
          stdout(green(`Created ${name.toLowerCase()} folder`));
        }
      }
    }
  },
});

const makeMigrationDefinition = {
  description:
    "Creates a migration file named <timestamp>_<name>.ts. The name is lower snake case with digits, e.g. some_migration_1.",
  options: {
    ...makeOptions,
    migrationTemplate: {
      type: "string",
      description: "Path or URL to a custom migration template.",
    },
    name: {
      type: "string",
      alias: "n",
      required: true,
      description:
        "The name of the migration, in lower snake case, e.g. create_users.",
    },
  },
} as const;

async function runMakeMigration(
  { flags, stdout }: {
    flags: {
      config: string;
      debug: boolean;
      folder?: string;
      force: boolean;
      migrationTemplate?: string;
      name: string;
    };
    stdout: (text: string) => void;
  },
) {
  if (!REGEXP_FILE_NAME.test(flags.name) || flags.name.length >= 80) {
    throw new UsageError(
      "Migration name has to be snake case and only include a-z (all lowercase) and 0-9",
    );
  }
  const fileName = `${format(new Date(), "yyyyMMddHHmmss")}_${flags.name}.ts`;
  if (!isMigrationFile(fileName)) {
    throw new NessieError(`Migration name '${fileName}' is not valid`);
  }

  await withState(flags, stdout, async (state) => {
    const templatePath = flags.migrationTemplate ??
      state.config.migrationTemplate;
    await makeFile(state, {
      kind: "migration",
      fileName,
      folder: flags.folder,
      force: flags.force,
      template: templatePath
        ? await readTemplate(templatePath)
        : getMigrationTemplate(),
    }, stdout);
  });
}

const makeMigration = defineCommand({
  name: "make:migration",
  ...makeMigrationDefinition,
  run: runMakeMigration,
});

/** Alias for `make:migration` */
const make = defineCommand({
  name: "make",
  ...makeMigrationDefinition,
  description:
    `Alias for make:migration. ${makeMigrationDefinition.description}`,
  run: runMakeMigration,
});

const makeSeed = defineCommand({
  name: "make:seed",
  description:
    "Creates a seed file named <name>.ts. The name is lower snake case with digits, e.g. some_seed_1.",
  options: {
    ...makeOptions,
    seedTemplate: {
      type: "string",
      description: "Path or URL to a custom seed template.",
    },
    name: {
      type: "string",
      alias: "n",
      required: true,
      description: "The name of the seed, in lower snake case, e.g. users.",
    },
  },
  async run({ flags, stdout }) {
    if (!REGEXP_FILE_NAME.test(flags.name)) {
      throw new UsageError(
        "Seed name has to be snake case and only include a-z (all lowercase) and 0-9",
      );
    }
    await withState(flags, stdout, async (state) => {
      const templatePath = flags.seedTemplate ?? state.config.seedTemplate;
      await makeFile(state, {
        kind: "seed",
        fileName: `${flags.name}.ts`,
        folder: flags.folder,
        force: flags.force,
        template: templatePath
          ? await readTemplate(templatePath)
          : getSeedTemplate(),
      }, stdout);
    });
  },
});

const seed = defineCommand({
  name: "seed",
  description:
    "Seeds the database with the seed files in the seed folders. All files, unless --matcher is given, which is a file name or a RegExp.",
  options: {
    ...common,
    matcher: {
      type: "string",
      alias: "m",
      description: "A seed file name, or a RegExp matching file names.",
    },
  },
  async run({ flags, stdout }) {
    await withState(flags, stdout, async ({ migrations }) => {
      await migrations.prepare();
      await migrations.seed(flags.matcher);
    });
  },
});

const migrate = defineCommand({
  name: "migrate",
  description:
    "Runs pending migrations, oldest first. All pending migrations, unless --amount is given.",
  options: {
    ...common,
    amount: {
      type: "string",
      alias: "a",
      description: "The number of migrations to run.",
    },
  },
  async run({ flags, stdout, stderr }) {
    const amount = parseAmount(flags.amount, false) as AmountMigrate;
    await withState(flags, stdout, async ({ migrations }) => {
      await migrations.migrate(amount);
    }, stderr);
  },
});

const rollback = defineCommand({
  name: "rollback",
  description:
    "Rolls back applied migrations, newest first. One migration, unless --amount is given.",
  options: {
    ...common,
    amount: {
      type: "string",
      alias: "a",
      description: "The number of migrations to roll back, or 'all'.",
    },
  },
  async run({ flags, stdout }) {
    const amount = parseAmount(flags.amount, true) as AmountRollback;
    await withState(flags, stdout, async ({ migrations }) => {
      await migrations.rollback(amount);
    });
  },
});

const status = defineCommand({
  name: "status",
  description:
    "Outputs the state of the migrations: available, completed, new and modified since they were applied.",
  options: {
    ...common,
    output: {
      type: "string",
      default: "log",
      description: "The output format: 'log' or 'json'.",
    },
    fileNames: {
      type: "boolean",
      description: "Adds file names to the output.",
    },
  },
  async run({ flags, stdout }) {
    if (!["log", "json"].includes(flags.output)) {
      throw new UsageError(
        `Output must be one of 'log' or 'json', got '${flags.output}'`,
      );
    }

    await withState(flags, stdout, async (state) => {
      await state.migrations.prepare();
      const completed = await state.migrations.getApplied();
      const available = state.migrationFiles.map((f) => f.name);
      const pending = available.filter((name) => !completed.includes(name));
      const modified = await state.migrations.getModified();

      const result: Record<string, unknown> = {
        totalAvailableMigrationFiles: available.length,
        completedMigrations: completed.length,
        newAvailableMigrations: pending.length,
        modifiedMigrations: modified.length,
      };
      if (flags.fileNames) {
        result.totalAvailableMigrationFileNames = available;
        result.completedMigrationNames = completed;
        result.newAvailableMigrationNames = pending;
        result.modifiedMigrationNames = modified;
      }

      if (flags.output === "json") {
        stdout(JSON.stringify(result));
        return;
      }

      const lines = ["Status", ""];
      const section = (key: string, names?: unknown) => {
        lines.push(`${key}: ${result[key]}`);
        if (Array.isArray(names)) lines.push(...names.map((n) => `\t${n}`));
      };
      section(
        "totalAvailableMigrationFiles",
        result.totalAvailableMigrationFileNames,
      );
      section("completedMigrations", result.completedMigrationNames);
      section("newAvailableMigrations", result.newAvailableMigrationNames);
      section("modifiedMigrations", result.modifiedMigrationNames);
      for (const name of modified) {
        lines.push(
          "",
          `Warning: migration ${name} has been modified since it was applied`,
        );
      }
      stdout(lines.join("\n"));
    });
  },
});

/** The root command of the nessie CLI */
export const cli = defineCommand({
  name: "nessie",
  version: denoConfig.version,
  description: "A database migration tool for Deno.",
  commands: [
    init,
    make,
    makeMigration,
    makeSeed,
    seed,
    migrate,
    rollback,
    status,
  ],
});
