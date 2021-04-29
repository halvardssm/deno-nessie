import { Denomander, exists, format } from "../deps.ts";
import { isUrl, parsePath } from "./utils.ts";
import type { ClientI, NessieConfig } from "../types.ts";
import {
  DEFAULT_CONFIG_FILE,
  MAX_FILE_NAME_LENGTH,
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
  client?: ClientI;

  constructor(args: Denomander) {
    this.enableDebug = args.debug;
    this.configFile = parsePath(args.config || DEFAULT_CONFIG_FILE);

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

    return this;
  }

  /** Makes the migration */
  async makeMigration(migrationName = "migration") {
    if (migrationName.includes(" ")) {
      throw new Error("Migration name cannot include spaces ` `");
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

    await Deno.mkdir(this.client!.migrationFolder, { recursive: true });

    const responseFile = await fetch(URL_TEMPLATE_BASE + "/migration.ts");

    await Deno.writeTextFile(
      `${this.client!.migrationFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(
      `Created migration ${fileName} at ${this.client!.migrationFolder}`,
    );
  }

  /** Makes the seed */
  async makeSeed(seedName = "seed") {
    const fileName = `${seedName}.ts`;
    if (this.client?.seedFiles.find((el) => el.name === seedName)) {
      console.info(`Seed with name '${seedName}' already exists.`);
    }

    this.logger(fileName, "Seed file name");

    await Deno.mkdir(this.client!.seedFolder, { recursive: true });

    const responseFile = await fetch(URL_TEMPLATE_BASE + "seed.ts");

    await Deno.writeTextFile(
      `${this.client!.seedFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(
      `Created seed ${fileName} at ${this.client!.seedFolder}`,
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
}
