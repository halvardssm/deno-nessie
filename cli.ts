import { State } from "./cli/state.ts";
import {
  CliffyCommand,
  CliffyCompletionsCommand,
  CliffyHelpCommand,
  CliffyIAction,
  dirname,
  format,
  resolve,
  yellow,
} from "./deps.ts";
import {
  DB_CLIENTS,
  DB_DIALECTS,
  DEFAULT_CONFIG_FILE,
  DEFAULT_MIGRATION_FOLDER,
  DEFAULT_SEED_FOLDER,
  REGEXP_MIGRATION_FILE_NAME_LEGACY,
  VERSION,
} from "./consts.ts";
import {
  AmountMigrateT,
  AmountRollbackT,
  CommandOptions,
  CommandOptionsInit,
} from "./types.ts";
import { getConfigTemplate } from "./cli/templates.ts";
import { isFileUrl, isMigrationFile } from "./cli/utils.ts";
import { NessieError } from "./cli/errors.ts";

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
    .option("-d, --debug", "Enables verbose output", { global: true })
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
        value: (value: string): string => {
          if (!["config", "folders"].includes(value)) {
            throw new NessieError(
              `Mode must be one of 'config' or 'folders', but got '${value}'.`,
            );
          }
          return value;
        },
      },
    )
    .option(
      "--dialect <dialect:string>",
      `Set the database dialect for the config file, can be one of '${DB_DIALECTS.PGSQL}', '${DB_DIALECTS.MYSQL}' or '${DB_DIALECTS.SQLITE}'. If not submitted, a general config file will be generated.`,
      {
        value: (value: string): string => {
          if (!(value in DB_CLIENTS)) {
            throw new NessieError(
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
    .alias("make")
    .action(makeMigration)
    .command(
      "make:seed <fileName:string>",
      "Creates a seed file with the name. Allows lower snake case and digits e.g. `some_seed_1`.",
    )
    .action(makeSeed)
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
      "Rolls back migrations. Optional number of rollbacks or 'all'. If not provided, it will do one.",
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
  const migrationFiles = state.client.migrationFiles
    .filter((el) =>
      isFileUrl(el.path) &&
      REGEXP_MIGRATION_FILE_NAME_LEGACY.test(el.name) &&
      parseInt(el.name.split("-")[0]) < 1672531200000
    )
    .map((el) => {
      const filenameArray = el.name.split("-", 2);
      const milliseconds = filenameArray[0];
      const filename = filenameArray[1];
      const timestamp = new Date(parseInt(milliseconds));
      const newDateTime = format(timestamp, "yyyyMMddHHmmss");
      const newName = newDateTime + "_" + filename;

      if (!isMigrationFile(newName)) {
        console.warn(
          `Migration ${el.name} has been updated to ${newName}, but this is not a valid filename. Please change this filename manually. See the method 'isMigrationFile' from 'mod.ts' for filename validation`,
        );
      }

      return {
        oldPath: el.path,
        newPath: resolve(dirname(el.path), newName),
      };
    });

  for await (const { oldPath, newPath } of migrationFiles) {
    await Deno.rename(oldPath, newPath);
  }

  const output = migrationFiles
    .map(({ oldPath, newPath }) => `${oldPath} => ${newPath}`)
    .join("\n");

  console.info(output);
};

/** Main application */
const run = async () => {
  try {
    await cli();

    Deno.exit();
  } catch (e) {
    if (e instanceof NessieError) {
      console.error(e);
    } else {
      console.error(
        e,
        "\n",
        yellow(
          "This error is most likely unrelated to Nessie, and is probably related to the client, the connection config or the query you are trying to execute.",
        ),
      );
    }
    Deno.exit(1);
  }
};

run();
