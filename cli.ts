import { State } from "./cli/state.ts";
import { Denomander } from "./deps.ts";

const initDenomander = () => {
  const program = new Denomander({
    app_name: "Nessie Migrations",
    app_description: "A database migration tool for Deno.",
    app_version: "0.1.0",
  });

  program
    .option("-d --debug", "Enables verbose output")
    .option(
      "-c --config",
      "Path to config file, will default to ./nessie.config.ts",
    )
    .command("make [migrationName]", "Creates a migration file with the name")
    .command("migrate", "Migrates one migration")
    .command("rollback", "Rolls back one migration");

  program.parse(Deno.args);

  return program;
};

const run = async () => {
  const prog = initDenomander();

  const state = await new State(prog).init();

  try {
    if (prog.make) {
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
