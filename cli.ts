import Denomander from "https://deno.land/x/denomander/mod.ts";
import { _nessieConfig } from "./nessie.config.ts";
import { State } from "./cli/state.ts";

const program = new Denomander(
  {
    app_name: "Nessie Migrations",
    app_description: "A database migration tool for Deno.",
    app_version: "0.1.0",
  },
);

program
  .option("-d --debug", "Enables verbose output")
  .option(
    "-c --config",
    "Path to config file, will default to ./nessie.config.json",
  )
  .command("make [migrationName]", "Creates a migration file with the name")
  .command("migrate", "Migrates one migration")
  .command("rollback", "Rolls back one migration");

program.parse(Deno.args);

const run = async (prog: Denomander) => {
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
  } catch (e) {
    console.error(e);
  }
};

run(program);
