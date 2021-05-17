import { State } from "./cli/state.ts";
import {
  CliffyCommand,
  CliffyCompletionsCommand,
  CliffyHelpCommand,
  CliffyIAction,
  format,
  resolve,
} from "./deps.ts";
import {
  DB_CLIENTS,
  DB_DIALECTS,
  DEFAULT_CONFIG_FILE,
  DEFAULT_MIGRATION_FOLDER,
  DEFAULT_SEED_FOLDER,
  REGEX_MIGRATION_FILE_NAME_LEGACY,
  VERSION,
} from "./consts.ts";
import {
  AmountMigrateT,
  AmountRollbackT,
  CommandOptions,
  CommandOptionsInit,
} from "./types.ts";
import { getConfigTemplate } from "./cli/templates.ts";

// deno-lint-ignore no-explicit-any
type TCliffyAction<T extends unknown[] = any[]> = CliffyIAction<
  void,
  T,
  void,
  CommandOptions,
  CliffyCommand<void, [], CommandOptions, void, undefined>
>;

/** Initializes CliffyCommand */
const cli = async () => {
  await new CliffyCommand<void, [], CommandOptions>()
    .name("Nessie Migrations")
    .version(VERSION)
    .description("A database migration tool for Deno.")
    .option("-d, --debug [debug:boolean]", "Enables verbose output", {
      global: true,
      default: false,
    })
    .option(
      "-c, --config <config:string>",
      "Path to config file.",
      { global: true, default: `./${DEFAULT_CONFIG_FILE}` },
    )
    .command("init", "Generates the config file.")
    .option(
      "--mode <mode:string>",
      "Select the mode for what to create, can be one of 'config' or 'folders'. If not sumbitted, it will create both the config file and folders.",
      {
        value: (value: string): string[] => {
          if (!["config", "folders"].includes(value)) {
            throw new Error(
              `Mode must be one of 'config' or 'folders', but got "${value}".`,
            );
          }
          return [value];
        },
      },
    )
    .option(
      "--dialect <dialect:string>",
      `Set the database dialect for the config file, can be one of '${DB_DIALECTS.PGSQL}', '${DB_DIALECTS.MYSQL}' or '${DB_DIALECTS.SQLITE}'. If not submitted, a general config file will be generated.`,
      {
        value: (value: string): string => {
          if (!(value in DB_CLIENTS)) {
            throw new Error(
              `Mode must be one of '${DB_DIALECTS.PGSQL}', '${DB_DIALECTS.MYSQL}' or '${DB_DIALECTS.SQLITE}', but got '${value}'.`,
            );
          }
          return value;
        },
      },
    )
    .action(initNessie)
    .command(
      "make:migration <fileName:string>",
      "Creates a migration file with the name. Allows lower snake case and digits e.g. `some_migration_1`.",
    )
    .action(makeMigration)
    .command(
      "make:seed <fileName:string>",
      "Creates a seed file with the name. Allows lower snake case and digits e.g. `some_seed_1`.",
    )
    .action(makeSeed)
    .command("make <fileName:string>", "Alias of make:migration.")
    .action(makeMigration)
    .command(
      "seed [matcher:string]",
      "Seeds the database with the files found with the matcher in the seed folder specified in the config file. Matcher is optional, and accepts string literals and RegExp.",
    )
    .action(seed)
    .command(
      "migrate [amount:number]",
      "Migrates migrations. Optional number of migrations. If not provided, it will do all available.",
    )
    .action(migrate)
    .command(
      "rollback [amount:string]",
      "Rolls back migrations. Optional number of rollbacks. If not provided, it will do one.",
    )
    .action(rollback)
    .command(
      "update_timestamps",
      "Update the timestamp format from milliseconds to timestamp. This command should be run inside of the folder where you store your migrations. Will only update timestams where the value is less than 1672531200000 (2023-01-01) so that the timestamps won't be updated multiple times.",
    )
    .action(updateTimestamps)
    .command("completions", new CliffyCompletionsCommand())
    .command("help", new CliffyHelpCommand())
    .parse(Deno.args);
};

/** Initializes Nessie */
const initNessie: TCliffyAction = async (options: CommandOptionsInit) => {
  const template = getConfigTemplate(options.dialect);

  if (options.mode !== "folders") {
    await Deno.writeTextFile(
      resolve(Deno.cwd(), DEFAULT_CONFIG_FILE),
      template,
    );
  }

  if (options.mode !== "config") {
    await Deno.mkdir(resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER), {
      recursive: true,
    });
    await Deno.mkdir(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER), {
      recursive: true,
    });
    await Deno.create(
      resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER, ".gitkeep"),
    );
    await Deno.create(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER, ".gitkeep"));
  }
};

const makeMigration: TCliffyAction = async (
  options: CommandOptions,
  fileName: string,
) => {
  const state = await State.init(options);
  await state.makeMigration(fileName);
};

const makeSeed: TCliffyAction = async (
  options: CommandOptions,
  fileName: string,
) => {
  const state = await State.init(options);
  await state.makeSeed(fileName);
};

const seed: TCliffyAction = async (
  options: CommandOptions,
  matcher: string | undefined,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.seed(matcher);
  await state.client.close();
};

const migrate: TCliffyAction = async (
  options: CommandOptions,
  amount: AmountMigrateT,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.migrate(amount);
  await state.client.close();
};

const rollback: TCliffyAction = async (
  options: CommandOptions,
  amount: AmountRollbackT,
) => {
  amount = amount === "all" ? amount : parseInt(amount as unknown as string);

  const state = await State.init(options);
  await state.client.prepare();
  await state.client.rollback(amount);
  await state.client.close();
};

const updateTimestamps: TCliffyAction = async (
  options: CommandOptions,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.updateTimestamps();
  await state.client.close();
  const migrationFiles = [...Deno.readDirSync(Deno.cwd())];

  const filteredMigrations = migrationFiles
    .filter((el) =>
      el.isFile &&
      REGEX_MIGRATION_FILE_NAME_LEGACY.test(el.name) &&
      parseInt(el.name.split("-")[0]) < 1672531200000
    )
    .sort()
    .map((el) => {
      const filenameArray = el.name.split("-", 2);
      const milliseconds = filenameArray[0];
      const filename = filenameArray[1];
      const timestamp = new Date(parseInt(milliseconds));
      const newDateTime = format(timestamp, "yyyyMMddHHmmss");

      return {
        oldName: el.name,
        newName: newDateTime + "-" + filename,
      };
    });

  for await (const { oldName, newName } of filteredMigrations) {
    await Deno.rename(oldName, newName);
  }

  const output = filteredMigrations
    .map(({ oldName, newName }) => `${oldName} => ${newName}`)
    .join("\n");

  const encoder = new TextEncoder();

  await Deno.stdout.write(encoder.encode(output));
};

/** Main application */
const run = async () => {
  try {
    await cli();

    Deno.exit();
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
};

run();
