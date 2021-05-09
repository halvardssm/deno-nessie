import { CliffySelect, exists, format } from "../deps.ts";
import { isUrl, parsePath } from "./utils.ts";
import type { CommandOptions, NessieConfig } from "../types.ts";
import {
  DEFAULT_CONFIG_FILE,
  MAX_FILE_NAME_LENGTH,
  REGEX_FILE_NAME,
  URL_TEMPLATE_BASE,
} from "../consts.ts";

/** The main state for the application.
 *
 * Contains the client, and handles the communication to the database.
 */
export class State {
  private readonly enableDebug: boolean;
  private readonly configFile: string;
  private config?: NessieConfig;
  client?: NessieConfig["client"];

  constructor(options: CommandOptions) {
    this.enableDebug = options.debug;
    this.configFile = parsePath(options.config || DEFAULT_CONFIG_FILE);

    this.logger([this.enableDebug, this.configFile], "State");
  }

  /** Initializes the state with a client */
  async init() {
    this.logger("Checking config path");

    if (isUrl(this.configFile) || exists(this.configFile)) {
      const configRaw = await import(this.configFile);
      this.config = configRaw.default;
    } else if (
      isUrl(parsePath(DEFAULT_CONFIG_FILE)) ||
      exists(parsePath(DEFAULT_CONFIG_FILE))
    ) {
      this.logger("Checking project root");

      const configRaw = await import(parsePath(DEFAULT_CONFIG_FILE));
      this.config = configRaw.default;
    } else {
      throw new Error("Config file is not found");
    }

    this.client = this.config!.client;

    this.client.setLogger(this.logger.bind(this));

    if (this.config?.experimental) {
      this.client?.isExperimental?.();
    }

    return this;
  }

  /** Makes the migration */
  async makeMigration(migrationName = "migration") {
    if (!REGEX_FILE_NAME.test(migrationName) || migrationName.length >= 80) {
      throw new Error(
        "Migration name has to be snakecase and only include a-z (all lowercase) and 1-9",
      );
    }

    let prefix;

    if (this.config!.useDateTime) {
      const timestamp = new Date();
      prefix = format(timestamp, "yyyyMMddHHmmss");
    } else {
      prefix = Date.now();
    }

    const fileName = `${prefix}-${migrationName}.ts`;

    if (fileName.length > MAX_FILE_NAME_LENGTH) {
      throw new Error("Migration name can't be longer than 80 characters");
    } else {
      this.logger(fileName, "Migration file name");
    }

    const selectedFolder = await this._folderPrompt(
      this.client!.migrationFolders,
    );

    await Deno.mkdir(selectedFolder, { recursive: true });

    const responseFile = await fetch(URL_TEMPLATE_BASE + "/migration.ts");

    await Deno.writeTextFile(
      `${selectedFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(
      `Created migration ${fileName} at ${selectedFolder}`,
    );
  }

  /** Makes the seed */
  async makeSeed(seedName = "seed") {
    if (!REGEX_FILE_NAME.test(seedName)) {
      throw new Error(
        "Seed name has to be snakecase and only include a-z (all lowercase) and 1-9",
      );
    }

    const fileName = `${seedName}.ts`;
    if (this.client?.seedFiles.find((el) => el.name === seedName)) {
      console.info(`Seed with name '${seedName}' already exists.`);
    }

    this.logger(fileName, "Seed file name");

    const selectedFolder = await this._folderPrompt(this.client!.seedFolders);

    await Deno.mkdir(selectedFolder, { recursive: true });

    const responseFile = await fetch(URL_TEMPLATE_BASE + "seed.ts");

    await Deno.writeTextFile(
      `${selectedFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(
      `Created seed ${fileName} at ${selectedFolder}`,
    );
  }

  /** A logger to use throughout the application, outputs when the debugger is enabled */
  // deno-lint-ignore no-explicit-any
  logger(output?: any, title?: string): void {
    try {
      if (this.enableDebug) {
        title ? console.log(title + ": ") : null;
        console.log(output);
      }
    } catch {
      console.error("Error at: " + title);
    }
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
}
