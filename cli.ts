import { State } from "./cli/state.ts";
import { CliffyCommand, CompletionsCommand, format, resolve } from "./deps.ts";
import {
  DEFAULT_CONFIG_FILE,
  URL_TEMPLATE_BASE,
  URL_TEMPLATE_BASE_VERSIONED,
  VERSION,
} from "./consts.ts";
import { AmountMigrateT, AmountRollbackT, CommandOptions } from "./types.ts";
import { isValidMigrationName } from "./cli/utils.ts";

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
    .action(async () => await initNessie())
    .command(
      "make:migration <fileName:string>",
      "Creates a migration file with the name. Allows lower snake case and digits e.g. `some_migration_1`.",
    )
    .example("test", "tester")
    .action(makeMigration)
    .command(
      "make:seed <fileName:string>",
      "Creates a seed file with the name. Allows lower snake case and digits e.g. `some_seed_1`.",
    )
    .action(async (options, fileName: string) => {
      const state = await new State(options).init();
      await state.makeSeed(fileName);
    })
    .command("make <fileName:string>", "Alias of make:migration.")
    .action(makeMigration)
    .command(
      "seed [matcher:string]",
      "Seeds the database with the files found with the matcher in the seed folder specified in the config file. Matcher is optional, and accepts string literals and RegExp.",
    )
    .action(async (options, matcher: string | undefined) => {
      const state = await new State(options).init();
      await state.client!.prepare();
      await state.client!.seed(matcher);
      await state.client!.close();
    })
    .command(
      "migrate [amount:number]",
      "Migrates migrations. Optional number of migrations. If not provided, it will do all available.",
    )
    .action(async (options, amount: AmountMigrateT) => {
      const state = await new State(options).init();
      await state.client!.prepare();
      await state.client!.migrate(amount);
      await state.client!.close();
    })
    .command(
      "rollback [amount:string]",
      "Rolls back migrations. Optional number of rollbacks. If not provided, it will do one.",
    )
    .action(async (options, amount: AmountRollbackT) => {
      amount = amount === "all"
        ? amount
        : parseInt(amount as unknown as string);

      const state = await new State(options).init();
      await state.client!.prepare();
      await state.client!.rollback(amount);
      await state.client!.close();
    })
    .command(
      "update_timestamps",
      "Update the timestamp format from milliseconds to timestamp. This command should be run inside of the folder where you store your migrations. Will only update timestams where the value is less than 1672531200000 (2023-01-01) so that the timestamps won't be updated multiple times.",
    )
    .action(async (options) => {
      const state = await new State(options).init();
      await state.client!.prepare();
      await updateTimestamps();
      await state.client!.updateTimestamps();
      await state.client!.close();
    })
    .command("completions", new CompletionsCommand())
    .parse(Deno.args);
};

/** Initializes Nessie */
const initNessie = async () => {
  let response = await fetch(URL_TEMPLATE_BASE_VERSIONED + "config.ts");

  //fetch unversioned in case versioned does not exists
  if (!response.ok) {
    response = await fetch(URL_TEMPLATE_BASE + "config.ts");
  }

  //throw if not successfull
  if (!response.ok) {
    throw response.statusText;
  }

  await Deno.writeTextFile(
    resolve(Deno.cwd(), "nessie.config.ts"),
    await response.text(),
  );

  await Deno.mkdir(resolve(Deno.cwd(), "db/migrations"), { recursive: true });
  await Deno.mkdir(resolve(Deno.cwd(), "db/seeds"), { recursive: true });
  await Deno.create(resolve(Deno.cwd(), "db/migrations/.gitkeep"));
  await Deno.create(resolve(Deno.cwd(), "db/seeds/.gitkeep"));
};

const updateTimestamps = async () => {
  const migrationFiles = [...Deno.readDirSync(Deno.cwd())];

  const filteredMigrations = migrationFiles
    .filter((el) =>
      el.isFile &&
      isValidMigrationName(el.name, true, true) &&
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

const makeMigration = async (options: CommandOptions, fileName: string) => {
  const state = await new State(options).init();
  await state.makeMigration(fileName);
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
