import { State } from "./cli/state.ts";
import { Denomander, resolve } from "./deps.ts";

const initDenomander = () => {
  const program = new Denomander({
    app_name: "Nessie Migrations",
    app_description: "A database migration tool for Deno.",
    app_version: "0.4.1",
  });

  program
    .option("-d --debug", "Enables verbose output")
    .option(
      "-c --config",
      "Path to config file, will default to ./nessie.config.ts",
    )
    .command("init", "Generates the config file")
    .command("make [migrationName]", "Creates a migration file with the name")
    .command("migrate", "Migrates one migration")
    .command("rollback", "Rolls back one migration");

  program.parse(Deno.args);

  return program;
};

const initNessie = async () => {
  const responseFile = await fetch(
    "https://deno.land/x/nessie/cli/templates/config.ts",
  );

  await Deno.writeTextFile(
    resolve(Deno.cwd(), "nessie.config.ts"),
    await responseFile.text(),
  );
};

const run = async () => {
  const prog = initDenomander();

  const state = await new State(prog).init();

  try {
    if (prog.init) {
      await initNessie();
    } else if (prog.make) {
      await state.makeMigration(prog.make);
    } else {
      await state.initClient();

      if (prog.migrate) {
        await state.client!.migrate();
      } else if (prog.rollback) {
        await state.client!.rollback();
      }

      await state.client!.close();
    }
    Deno.exit();
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
};

run();
