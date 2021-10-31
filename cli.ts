import { State } from "./cli/state.ts";
import {
  CliffyCommand,
  CliffyCompletionsCommand,
  CliffyHelpCommand,
  CliffyIAction,
  dirname,
  exists,
  format,
  green,
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
  SPONSOR_NOTICE,
  VERSION,
} from "./consts.ts";
import {
  AmountMigrateT,
  AmountRollbackT,
  CommandOptions,
  CommandOptionsInit,
  CommandOptionsMakeMigration,
  CommandOptionsMakeSeed,
  CommandOptionsStatus,
} from "./types.ts";
import { getConfigTemplate } from "./cli/templates.ts";
import { isFileUrl, isMigrationFile } from "./cli/utils.ts";
import { NessieError } from "./cli/errors.ts";

type TCliffyAction<
  // deno-lint-ignore no-explicit-any
  T extends unknown[] = any[],
  O extends CommandOptions = CommandOptions,
> = CliffyIAction<
  void,
  T,
  void,
  O,
  CliffyCommand<void, [], O, void, undefined>
>;

/** Initializes CliffyCommand */
const cli = async () => {
  await new CliffyCommand<void, [], CommandOptions>()
    .name("Nessie Migrations")
    .version(VERSION)
    .description("A database migration tool for Deno.\n" + SPONSOR_NOTICE)
    .option("-d, --debug", "Enables verbose output", { global: true })
    .option(
      "-c, --config <config:string>",
      "Path to config file.",
      { global: true, default: `./${DEFAULT_CONFIG_FILE}` },
    )
    .option(
      "--seedTemplate <template:string>",
      "Path or URL to a custom seed template. Only used together with the make commands.",
      { global: true },
    )
    .option(
      "--migrationTemplate <template:string>",
      "Path or URL to a custom migration template. Only used together with the make commands.",
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

/** Initializes Nessie */
// deno-lint-ignore no-explicit-any
const initNessie: TCliffyAction<any[], CommandOptionsInit> = async (
  options,
) => {
  const template = getConfigTemplate(options.dialect);

  if (options.mode !== "folders") {
    const filePath = resolve(Deno.cwd(), DEFAULT_CONFIG_FILE);
    const fileExists = await exists(filePath);

    if (fileExists) {
      console.info(green("Config file already exists"));
    } else {
      await Deno.writeTextFile(
        filePath,
        template,
      );

      console.info(green("Created config file"));
    }
  }

  if (options.mode !== "config") {
    const migrationFolderExists = await exists(
      resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER),
    );
    const seedFolderExists = await exists(
      resolve(Deno.cwd(), DEFAULT_SEED_FOLDER),
    );

    if (migrationFolderExists) {
      console.info(green("Migration folder already exists"));
    } else {
      await Deno.mkdir(resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER), {
        recursive: true,
      });
      await Deno.create(
        resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER, ".gitkeep"),
      );
      console.info(green("Created migration folder"));
    }

    if (seedFolderExists) {
      console.info(green("Seed folder already exists"));
    } else {
      await Deno.mkdir(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER), {
        recursive: true,
      });
      await Deno.create(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER, ".gitkeep"));
      console.info(green("Created seed folder"));
    }
  }

  console.info(SPONSOR_NOTICE);
};

// deno-lint-ignore no-explicit-any
const makeMigration: TCliffyAction<any[], CommandOptionsMakeMigration> = async (
  options,
  fileName: string,
) => {
  const state = await State.init(options);
  await state.makeMigration(fileName);
};

// deno-lint-ignore no-explicit-any
const makeSeed: TCliffyAction<any[], CommandOptionsMakeSeed> = async (
  options,
  fileName: string,
) => {
  const state = await State.init(options);
  await state.makeSeed(fileName);
};

const seed: TCliffyAction = async (
  options,
  matcher: string | undefined,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.seed(matcher);
  await state.client.close();
};

const migrate: TCliffyAction = async (
  options,
  amount: AmountMigrateT,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.migrate(amount);
  await state.client.close();
};

const rollback: TCliffyAction = async (
  options,
  amount: AmountRollbackT,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.rollback(amount);
  await state.client.close();
};

const updateTimestamps: TCliffyAction = async (options) => {
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

// deno-lint-ignore no-explicit-any
const status: TCliffyAction<any[], CommandOptionsStatus> = async (options) => {
  const state = await State.init(options);
  await state.client.prepare();
  const allCompletedMigrations = await state.client.getAll();
  await state.client.close();

  const newAvailableMigrations = state.client.migrationFiles
    .filter((el) => !allCompletedMigrations.includes(el.name));

  // deno-lint-ignore no-explicit-any
  const outputJson: Record<string, any> = {
    totalAvailableMigrationFiles: state.client.migrationFiles.length,
    completedMigrations: allCompletedMigrations.length,
    newAvailableMigrations: newAvailableMigrations.length,
  };

  if (options.fileNames) {
    outputJson.totalAvailableMigrationFileNames = state.client.migrationFiles
      .map((el) => el.name);
    outputJson.completedMigrationNames = allCompletedMigrations;
    outputJson.newAvailableMigrationNames = state.client.migrationFiles
      .map((el) => el.name);
  }

  switch (options.output) {
    case "json":
      console.info(JSON.stringify(outputJson, undefined, 0));
      break;
    case "log":
    default:
      {
        let output = "Status\n\n";
        const tabbedLines = (str: string) => {
          output += `\t${str}\n`;
        };

        output +=
          `totalAvailableMigrationFiles: ${outputJson.totalAvailableMigrationFiles}\n`;
        if (options.fileNames) {
          outputJson.totalAvailableMigrationFileNames.forEach(tabbedLines);
        }

        output += `completedMigrations: ${outputJson.completedMigrations}\n`;
        if (options.fileNames) {
          outputJson.completedMigrationNames.forEach(tabbedLines);
        }

        output +=
          `newAvailableMigrations: ${outputJson.newAvailableMigrations}\n`;
        if (options.fileNames) {
          outputJson.newAvailableMigrationNames.forEach(tabbedLines);
        }

        console.info(output);
      }
      break;
  }
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
