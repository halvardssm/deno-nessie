import { State } from "./cli/state.ts";
import { Denomander, format, resolve } from "./deps.ts";
import {
  REGEX_MIGRATION_FILE_NAME_LEGACY,
  URL_TEMPLATE_BASE,
  URL_TEMPLATE_BASE_VERSIONED,
  VERSION,
} from "./consts.ts";

/** Initializes Denomander */
const initDenomander = () => {
  const program = new Denomander({
    app_name: "Nessie Migrations",
    app_description: "A database migration tool for Deno.",
    app_version: VERSION,
  });

  program
    .globalOption("-d --debug", "Enables verbose output")
    .globalOption(
      "-c --config",
      "Path to config file, will default to ./nessie.config.ts",
    )
    .command("init", "Generates the config file")
    .command(
      "make:migration [fileName]",
      "Creates a migration file with the name",
    )
    .command("make:seed [fileName]", "Creates a seed file with the name")
    .command("make [fileName]", "Alias of make:migration")
    .command(
      "seed [matcher?]",
      "Seeds the database with the files found with the matcher in the seed folder specified in the config file. Matcher is optional, and accepts string literals and RegExp",
    )
    .command(
      "migrate [amount?]",
      "Migrates migrations. Optional number of migrations. If not provided, it will do all available.",
    )
    .command(
      "rollback [amount?]",
      "Rolls back migrations. Optional number of rollbacks. If not provided, it will do one.",
    )
    .command(
      "update_timestamps",
      "Update the timestamp format from milliseconds to timestamp. This command should be run inside of the folder where you store your migrations. Will only update timestams where the value is less than 1672531200000 (2023-01-01) so that the timestamps wont be updated multiple times.",
    );

  program.parse(Deno.args);

  return program;
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
    const prog = initDenomander();

    if (prog.init) {
      await initNessie();
    } else {
      const state = await new State(prog).init();

      if (prog["make:migration"] || prog.make) {
        await state.makeMigration(prog.fileName);
      } else if (prog["make:seed"]) {
        await state.makeSeed(prog.fileName);
      } else {
        await state.client!.prepare();

        if (prog.migrate) {
          await state.client!.migrate(prog.amount);
        } else if (prog.rollback) {
          await state.client!.rollback(prog.amount);
        } else if (prog.seed) {
          await state.client!.seed(prog.matcher);
        } else if (prog.update_timestamps) {
          await updateTimestamps();
          await state.client!.updateTimestamps();
        }

        await state.client!.close();
      }
    }

    Deno.exit();
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
};

run();
