import {
  CliffyCommand,
  CliffyCompletionsCommand,
  CliffyHelpCommand,
  yellow,
} from "./deps.ts";
import {
  DB_CLIENTS,
  DB_DIALECTS,
  DEFAULT_CONFIG_FILE,
  SPONSOR_NOTICE,
  VERSION,
} from "./consts.ts";
import { CommandOptions } from "./types.ts";
import { NessieError } from "./cli/errors.ts";
import {
  initNessie,
  makeMigration,
  makeSeed,
  migrate,
  rollback,
  seed,
  status,
  updateTimestamps,
} from "./cli/commands.ts";

/** Initializes CliffyCommand */
const cli = async () => {
  await new CliffyCommand<void, [], CommandOptions>()
    .name("Nessie Migrations")
    .version(VERSION)
    .description("A database migration tool for Deno.\n" + SPONSOR_NOTICE)
    .option("-d, --debug", "Enables verbose output.", { global: true })
    .option(
      "-c, --config <config:string>",
      "Path to config file.",
      { global: true, default: `./${DEFAULT_CONFIG_FILE}` },
    )
    .option(
      "--seedTemplate <template:string>",
      "Path or URL to a custom seed template. Only used together with the `make` commands.",
      { global: true },
    )
    .option(
      "--migrationTemplate <template:string>",
      "Path or URL to a custom migration template. Only used together with the `make` commands.",
      { global: true },
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
    .command(
      "status",
      "Outputs the status of Nessie. Will output detailed information about current state of the migrations.",
    )
    .action(status)
    .option(
      "--output <output:string>",
      `Sets the output format, can be one of 'log' or 'json'.`,
      {
        default: "log",
        value: (value: string): string => {
          if (!["log", "json"].includes(value)) {
            throw new NessieError(
              `Output must be one of 'log' or 'json', but got '${value}'.`,
            );
          }
          return value;
        },
      },
    )
    .option("--file-names", "Adds filenames to output")
    .command("completions", new CliffyCompletionsCommand())
    .command("help", new CliffyHelpCommand())
    .parse(Deno.args);
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

await run();
