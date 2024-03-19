import { State } from "./state.ts";
import { green } from "@std/fmt/colors";
import { resolve } from "@std/path";
import { exists } from "@std/fs";
import {
  ArgumentValue,
  Command,
  CompletionsCommand,
  EnumType,
  HelpCommand,
  NumberType,
  StringType,
  Type,
  ValidationError,
} from "@cliffy/command";
import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_MIGRATION_FOLDER,
  DEFAULT_SEED_FOLDER,
  getConfigTemplate,
  SPONSOR_NOTICE,
  VERSION,
} from "../mod.ts";

const enumTypeMode: EnumType<"config" | "folders"> = new EnumType([
  "config",
  "folders",
]);
const enumTypeOutput: EnumType<"log" | "json"> = new EnumType(["log", "json"]);

/** Initializes Nessie */
export const initCommand: Command<
  GlobalCommandOptions,
  void,
  void,
  [],
  {
    mode?: typeof enumTypeMode | undefined;
  }
> = new Command<GlobalCommandOptions>()
  .description("Generates the config file.")
  .type("mode", enumTypeMode)
  .option(
    "--mode <mode:mode>",
    "Select the mode for what to create, can be one of 'config' or 'folders'. If not sumbitted, it will create both the config file and folders.",
  )
  .action(async (
    options,
  ) => {
    const template = getConfigTemplate();

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
  });

export const makeMigrationCommand: Command<
  GlobalCommandOptions,
  void,
  void,
  [(StringType | string)]
> = new Command<GlobalCommandOptions>()
  .description(
    "Creates a migration file with the name. Allows lower snake case and digits e.g. `some_migration_1`.",
  )
  .alias("make")
  .arguments("<fileName:string>")
  .action(async (
    options,
    fileName,
  ) => {
    const state = await State.init(options);
    await state.makeMigration(fileName);
  });

export const makeSeedCommand: Command<
  GlobalCommandOptions,
  void,
  void,
  [(StringType | string)]
> = new Command<GlobalCommandOptions>()
  .description(
    "Creates a seed file with the name. Allows lower snake case and digits e.g. `some_seed_1`.",
  )
  .arguments("<fileName:string>")
  .action(async (
    options,
    fileName,
  ) => {
    const state = await State.init(options);
    await state.makeSeed(fileName);
  });

export const seedCommand: Command<
  GlobalCommandOptions,
  void,
  void,
  [((StringType & string) | undefined)?]
> = new Command<GlobalCommandOptions>()
  .description(
    "Seeds the database with the files found with the matcher in the seed folder specified in the config file. Matcher is optional, and accepts string literals and RegExp.",
  )
  .arguments("[matcher:string]")
  .action(async (
    options,
    matcher,
  ) => {
    const state = await State.init(options);
    await state.client.prepare();
    await state.client.seed(matcher);
    await state.client.client.close();
  });

export const migrateCommand: Command<
  GlobalCommandOptions,
  void,
  void,
  [((NumberType & number) | undefined)?]
> = new Command<GlobalCommandOptions>()
  .description(
    "Migrates migrations. Optional number of migrations. If not provided, it will do all available.",
  )
  .arguments("[amount:number]")
  .action(async (
    options,
    amount,
  ) => {
    const state = await State.init(options);
    await state.client.prepare();
    await state.client.migrate(amount);
    await state.client.client.close();
  });

class RollbackAmountType extends Type<"all" | number> {
  public parse({ label, name, value }: ArgumentValue): "all" | number {
    if (value === "all") {
      return value;
    }
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      throw new ValidationError(
        `${label} "${name}" must be a valid vaule, but got "${value}". Possible values are: "all" or a number.`,
      );
    }

    return parsedValue;
  }
}

export const rollbackCommand: Command<
  GlobalCommandOptions,
  void,
  void,
  [(RollbackAmountType | undefined)?]
> = new Command<GlobalCommandOptions>()
  .description(
    "Rolls back migrations. Optional number of rollbacks or 'all'. If not provided, it will do one.",
  )
  .type("amount", new RollbackAmountType())
  .arguments("[amount:amount]")
  .action(async (
    options,
    amount,
  ) => {
    const state = await State.init(options);
    await state.client.prepare();
    await state.client.rollback(amount);
    await state.client.client.close();
  });

export const statusCommand: GlobalCommand = new Command<GlobalCommandOptions>()
  .description(
    "Outputs the status of Nessie. Will output detailed information about current state of the migrations.",
  )
  .type("output", enumTypeOutput)
  .option(
    "--output <output:output>",
    `Sets the output format, can be one of 'log' or 'json'.`,
  )
  .option("--file-names", "Adds filenames to output")
  .action(async (options) => {
    const state = await State.init(options);
    await state.client.prepare();
    const allCompletedMigrations = await state.client.getAllMigrations();
    await state.client.client.close();

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
  });

export type GlobalCommandOptions = {
  debug: boolean;
  config: string | (StringType & string);
  seedTemplate?: (StringType & string) | undefined;
  migrationTemplate?: (StringType & string) | undefined;
};

export type GlobalCommand = Command<
  void,
  void,
  void,
  [],
  GlobalCommandOptions
>;

/** Main Command */
export const mainCommand: GlobalCommand = new Command()
  .name("Nessie Migrations")
  .version(VERSION)
  .description("A database migration tool for Deno.\n" + SPONSOR_NOTICE)
  .globalOption("-d, --debug", "Enables verbose output.")
  .globalOption(
    "-c, --config <config:string>",
    "Path to config file.",
    { default: `./${DEFAULT_CONFIG_FILE}` },
  )
  .globalOption(
    "--seedTemplate <template:string>",
    "Path or URL to a custom seed template. Only used together with the `make` commands.",
  )
  .globalOption(
    "--migrationTemplate <template:string>",
    "Path or URL to a custom migration template. Only used together with the `make` commands.",
  );

mainCommand.command("init", initCommand)
  .command("make:migration", makeMigrationCommand)
  .command("make:seed", makeSeedCommand)
  .command("seed", seedCommand)
  .command("migrate", migrateCommand)
  .command("rollback", rollbackCommand)
  .command("status", statusCommand)
  .command("completions", new CompletionsCommand())
  .command("help", new HelpCommand());
