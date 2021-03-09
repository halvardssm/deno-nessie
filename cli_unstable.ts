import { Denomander, format } from "./deps.ts";
import { REGEX_MIGRATION_FILE_NAME_LEGACY, VERSION } from "./consts.ts";

/** Initializes Denomander */
const initDenomander = () => {
  const program = new Denomander({
    app_name: "Nessie Migrations",
    app_description: "A database migration tool for Deno.",
    app_version: VERSION,
  });

  program
    .globalOption("-d --debug", "Enables verbose output")
    .command(
      "update_timestamps",
      "Update the timestamp format from milliseconds to timestamp. This command should be run inside of the folder where you store your migrations.",
    );

  program.parse(Deno.args);

  return program;
};

const updateTimestamps = () => {
  const migrationFiles = [...Deno.readDirSync(Deno.cwd())];

  const filteredMigrations = migrationFiles
    .filter((el) => el.isFile && REGEX_MIGRATION_FILE_NAME_LEGACY.test(el.name))
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

  filteredMigrations.forEach(({ oldName, newName }) => {
    Deno.renameSync(oldName, newName);
  });

  const output = filteredMigrations
    .map(({ oldName, newName }) => `${oldName} => ${newName}`)
    .join("\n");

  const encoder = new TextEncoder();

  Deno.stdout.writeSync(encoder.encode(output));
};

/** Main application */
const run = () => {
  try {
    const prog = initDenomander();

    if (prog.update_timestamps) {
      updateTimestamps();
    } else {
      console.info("No command selected");
    }

    Deno.exit();
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
};

run();
