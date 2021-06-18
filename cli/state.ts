import {
  basename,
  CliffySelect,
  CliffyToggle,
  exists,
  format,
  fromFileUrl,
  resolve,
} from "../deps.ts";
import {
  arrayIsUnique,
  getLogger,
  isFileUrl,
  isMigrationFile,
  isUrl,
} from "./utils.ts";
import type {
  CommandOptions,
  FileEntryT,
  LoggerFn,
  NessieConfig,
  StateOptions,
} from "../types.ts";
import {
  DEFAULT_MIGRATION_FOLDER,
  DEFAULT_SEED_FOLDER,
  REGEXP_FILE_NAME,
} from "../consts.ts";
import { getMigrationTemplate, getSeedTemplate } from "./templates.ts";
import { NessieError } from "./errors.ts";

/** The main state for the application.
 *
 * Contains the client, and handles the communication to the database.
 */
export class State {
  readonly #config: NessieConfig;
  readonly #migrationFolders: string[];
  readonly #seedFolders: string[];
  readonly #migrationFiles: FileEntryT[];
  readonly #seedFiles: FileEntryT[];
  client: NessieConfig["client"];

  logger: LoggerFn = () => {};

  constructor(options: StateOptions) {
    this.#config = options.config;
    this.#migrationFolders = options.migrationFolders;
    this.#seedFolders = options.seedFolders;
    this.#migrationFiles = options.migrationFiles;
    this.#seedFiles = options.seedFiles;

    if (options.debug || this.#config.debug) {
      this.logger = getLogger();
    }

    this.client = options.config.client;
    this.client.setLogger(this.logger);

    this.logger({
      migrationFolders: this.#migrationFolders,
      seedFolders: this.#seedFolders,
      migrationFiles: this.#migrationFiles,
      seedFiles: this.#seedFiles,
    }, "State");
  }

  /** Initializes the state with a client */
  static async init(options: CommandOptions) {
    if (options.debug) console.log("Checking config path");

    const path = isUrl(options.config)
      ? options.config
      : "file://" + resolve(Deno.cwd(), options.config);

    if (!isFileUrl(path) && !(await exists(fromFileUrl(path)))) {
      throw new NessieError(`Config file is not found at ${path}`);
    }

    const configRaw = await import(path);
    const config: NessieConfig = configRaw.default;

    if (!config.client) {
      throw new NessieError("Client is not valid");
    }

    const { migrationFolders, seedFolders } = this
      ._parseMigrationAndSeedFolders(config);
    const { migrationFiles, seedFiles } = this._parseMigrationAndSeedFiles(
      config,
      migrationFolders,
      seedFolders,
    );

    config.client.migrationFiles = migrationFiles;
    config.client.seedFiles = seedFiles;

    return new State({
      config,
      debug: options.debug,
      migrationFolders,
      migrationFiles,
      seedFolders,
      seedFiles,
    });
  }

  /** Parses and sets the migrationFolders and seedFolders */
  private static _parseMigrationAndSeedFolders(options: NessieConfig) {
    const migrationFolders: string[] = [];
    const seedFolders: string[] = [];

    if (
      options.migrationFolders && !arrayIsUnique(options.migrationFolders)
    ) {
      throw new NessieError(
        "Entries for the migration folders has to be unique",
      );
    }

    if (options.seedFolders && !arrayIsUnique(options.seedFolders)) {
      throw new NessieError("Entries for the seed folders has to be unique");
    }

    options.migrationFolders?.forEach((folder) => {
      migrationFolders.push(resolve(Deno.cwd(), folder));
    });

    if (
      migrationFolders.length < 1 &&
      options.additionalMigrationFiles === undefined
    ) {
      migrationFolders.push(resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER));
    }

    if (!arrayIsUnique(migrationFolders)) {
      throw new NessieError(
        "Entries for the resolved migration folders has to be unique",
      );
    }

    options.seedFolders?.forEach((folder) => {
      seedFolders.push(resolve(Deno.cwd(), folder));
    });

    if (seedFolders.length < 1 && options.additionalSeedFiles === undefined) {
      seedFolders.push(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER));
    }

    if (!arrayIsUnique(seedFolders)) {
      throw new NessieError(
        "Entries for the resolved seed folders has to be unique",
      );
    }
    return { migrationFolders, seedFolders };
  }

  /** Parses and sets the migrationFiles and seedFiles */
  private static _parseMigrationAndSeedFiles(
    options: NessieConfig,
    migrationFolders: string[],
    seedFolders: string[],
  ) {
    const migrationFiles: FileEntryT[] = [];
    const seedFiles: FileEntryT[] = [];

    migrationFolders.forEach((folder) => {
      const filesRaw: FileEntryT[] = Array.from(Deno.readDirSync(folder))
        .filter((file) => file.isFile && isMigrationFile(file.name))
        .map((file) => ({
          name: file.name,
          path: "file://" + resolve(folder, file.name),
        }));

      migrationFiles.push(...filesRaw);
    });

    options.additionalMigrationFiles?.forEach((file) => {
      const path = isUrl(file) ? file : "file://" + resolve(Deno.cwd(), file);

      const fileName = basename(path);

      if (isMigrationFile(fileName)) {
        migrationFiles.push({
          name: fileName,
          path,
        });
      }
    });

    if (!arrayIsUnique(migrationFiles.map((file) => file.name))) {
      throw new NessieError(
        "Entries for the migration files has to be unique",
      );
    }

    migrationFiles.sort((a, b) => parseInt(a.name) - parseInt(b.name));

    seedFolders.forEach((folder) => {
      const filesRaw = Array.from(Deno.readDirSync(folder))
        .filter((file) => file.isFile)
        .map((file) => ({
          name: file.name,
          path: "file://" + resolve(folder, file.name),
        }));

      seedFiles.push(...filesRaw);
    });

    options.additionalSeedFiles?.forEach((file) => {
      const path = isUrl(file) ? file : "file://" + resolve(Deno.cwd(), file);

      const fileName = basename(path);

      seedFiles.push({
        name: fileName,
        path,
      });
    });

    if (!arrayIsUnique(seedFiles.map((file) => file.name))) {
      throw new NessieError(
        "Entries for the resolved seed files has to be unique",
      );
    }

    seedFiles.sort((a, b) => a.name.localeCompare(b.name));

    return { migrationFiles, seedFiles };
  }

  /** Makes the migration */
  async makeMigration(migrationName = "migration") {
    if (!REGEXP_FILE_NAME.test(migrationName) || migrationName.length >= 80) {
      throw new NessieError(
        "Migration name has to be snakecase and only include a-z (all lowercase) and 1-9",
      );
    }

    const prefix = format(new Date(), "yyyyMMddHHmmss");

    const fileName = `${prefix}_${migrationName}.ts`;

    this.logger(fileName, "Migration file name");

    if (!isMigrationFile(fileName)) {
      throw new NessieError(`Migration name '${fileName}' is not valid`);
    }

    const selectedFolder = await this._folderPrompt(
      this.#migrationFolders.filter((folder) => !isUrl(folder)),
    );

    const template = getMigrationTemplate(this.client.dialect);

    const filePath = resolve(selectedFolder, fileName);

    if (await exists(filePath)) {
      const overwrite = await this._fileExistsPrompt(filePath);
      if (!overwrite) return;
    }

    await Deno.writeTextFile(filePath, template);

    console.info(`Created migration ${filePath}`);
  }

  /** Makes the seed */
  async makeSeed(seedName = "seed") {
    if (!REGEXP_FILE_NAME.test(seedName)) {
      throw new NessieError(
        "Seed name has to be snakecase and only include a-z (all lowercase) and 1-9",
      );
    }

    const fileName = `${seedName}.ts`;

    this.logger(fileName, "Seed file name");

    const selectedFolder = await this._folderPrompt(
      this.#seedFolders.filter((folder) => !isUrl(folder)),
    );

    const template = getSeedTemplate(this.client.dialect);

    const filePath = resolve(selectedFolder, fileName);

    if (await exists(filePath)) {
      const overwrite = await this._fileExistsPrompt(filePath);
      if (!overwrite) return;
    }

    await Deno.writeTextFile(filePath, template);

    console.info(`Created seed ${fileName} at ${selectedFolder}`);
  }

  private async _folderPrompt(folders: string[]) {
    let promptSelection = 0;

    if (folders.length > 1) {
      const promptResult = await CliffySelect.prompt({
        message:
          `You have multiple folder sources, where do you want to create the new file?`,
        options: folders.map((folder, i) => ({
          value: i.toString(),
          name: folder,
        })),
      });

      promptSelection = parseInt(promptResult);
    }

    this.logger(promptSelection, "Prompt input final");

    return folders[promptSelection];
  }

  private async _fileExistsPrompt(file: string): Promise<boolean> {
    const result: boolean = await CliffyToggle.prompt(
      `The file ${file} already exists, do you want to overwrite the existing file?`,
    );

    this.logger(result, "Toggle selection");

    return result;
  }
}
