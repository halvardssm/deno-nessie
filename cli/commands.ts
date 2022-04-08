import { State } from "./state.ts";
import {
  CliffyCommand,
  CliffyIAction,
  dirname,
  exists,
  format,
  green,
  resolve,
} from "../deps.ts";
import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_MIGRATION_FOLDER,
  DEFAULT_SEED_FOLDER,
  REGEXP_MIGRATION_FILE_NAME_LEGACY,
  SPONSOR_NOTICE,
} from "../consts.ts";
import {
  AmountMigrateT,
  AmountRollbackT,
  CommandOptions,
  CommandOptionsInit,
  CommandOptionsMakeMigration,
  CommandOptionsMakeSeed,
  CommandOptionsStatus,
} from "../types.ts";
import { getConfigTemplate } from "./templates.ts";
import { isFileUrl, isMigrationFile } from "./utils.ts";

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

// deno-lint-ignore no-explicit-any
export const initNessie: TCliffyAction<any[], CommandOptionsInit> = async (
  /** Initializes Nessie */
  // deno-lint-ignore no-explicit-any
  options: any,
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
export const makeMigration: TCliffyAction<any[], CommandOptionsMakeMigration> =
  async (
    // deno-lint-ignore no-explicit-any
    options: any,
    fileName: string,
  ) => {
    const state = await State.init(options);
    await state.makeMigration(fileName);
  };

// deno-lint-ignore no-explicit-any
export const makeSeed: TCliffyAction<any[], CommandOptionsMakeSeed> = async (
  // deno-lint-ignore no-explicit-any
  options: any,
  fileName: string,
) => {
  const state = await State.init(options);
  await state.makeSeed(fileName);
};

export const seed: TCliffyAction = async (
  // deno-lint-ignore no-explicit-any
  options: any,
  matcher: string | undefined,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.seed(matcher);
  await state.client.close();
};

export const migrate: TCliffyAction = async (
  options,
  amount: AmountMigrateT,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.migrate(amount);
  await state.client.close();
};

export const rollback: TCliffyAction = async (
  options,
  amount: AmountRollbackT,
) => {
  const state = await State.init(options);
  await state.client.prepare();
  await state.client.rollback(amount);
  await state.client.close();
};

export const updateTimestamps: TCliffyAction = async (options) => {
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
export const status: TCliffyAction<any[], CommandOptionsStatus> = async (
  options,
) => {
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
