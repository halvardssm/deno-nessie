import { AbstractClient } from "../clients/AbstractClient.ts";
import { ClientPostgreSQL } from "../clients/ClientPostgreSQL.ts";
import { Denomander } from "../deps.ts";
import { parsePath } from "./utils.ts";
import { NessieConfig, ClientI } from "../types.ts";

const STD_CONFIG_FILE = "nessie.config.ts";
const STD_CLIENT_OPTIONS = {
  seedFolder: "./db/seeds",
  migrationFolder: "./db/migrations",
};

/** The main state for the application.
 *
 * Contains the client, and handles the communication to the database.
 */
export class State {
  private enableDebug: boolean;
  private configFile: string;
  private config?: NessieConfig;
  client?: ClientI;

  constructor(prog: Denomander) {
    this.enableDebug = prog.debug;
    this.configFile = parsePath(prog.config || STD_CONFIG_FILE);

    this.logger([this.enableDebug, this.configFile], "State");
  }

  /** Initializes the state with a client */
  async init() {
    this.logger("Checking config path");
    this.config = await this._safeConfigImport(this.configFile);

    if (!this.config) {
      this.logger("Checking project root");
      this.config = await this._safeConfigImport(parsePath(STD_CONFIG_FILE));
    }

    if (!this.config?.client) {
      this.logger("Using standard config");

      this.client = new ClientPostgreSQL(STD_CLIENT_OPTIONS, {
        database: "nessie",
        hostname: "localhost",
        port: 5432,
        user: "root",
        password: "pwd",
      });
    } else {
      this.client = this.config.client;
    }

    if (this.config?.exposeQueryBuilder) {
      this.client.exposeQueryBuilder = this.config.exposeQueryBuilder;
    }

    this.client.setLogger(this.logger.bind(this));

    return this;
  }

  /** Makes the migration */
  async makeMigration(migrationName: string = "migration") {
    if (
      migrationName.length > AbstractClient.MAX_FILE_NAME_LENGTH - 13
    ) {
      throw new Error(
        `Migration name can't be longer than ${AbstractClient
          .MAX_FILE_NAME_LENGTH - 13}`,
      );
    }

    const fileName = `${Date.now()}-${migrationName}.ts`;

    this.logger(fileName, "Migration file name");

    await Deno.mkdir(this.client!.migrationFolder, { recursive: true });

    const responseFile = await fetch(
      "https://deno.land/x/nessie/cli/templates/migration.ts",
    );

    await Deno.writeTextFile(
      `${this.client!.migrationFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(
      `Created migration ${fileName} at ${this.client!.migrationFolder}`,
    );
  }

  /** Makes the seed */
  async makeSeed(seedName: string = "seed") {
    const fileName = `${seedName}.ts`;
    if (this.client?.seedFiles.find((el) => el.name === seedName)) {
      console.info(`Seed with name '${seedName}' already exists.`);
    }

    this.logger(fileName, "Seed file name");

    await Deno.mkdir(this.client!.seedFolder, { recursive: true });

    const responseFile = await fetch(
      "https://deno.land/x/nessie/cli/templates/seed.ts",
    );

    await Deno.writeTextFile(
      `${this.client!.seedFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(
      `Created seed ${fileName} at ${this.client!.seedFolder}`,
    );
  }

  /** A logger to use throughout the application, outputs when the debugger is enabled */
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

  /** Method for importing the config files */
  private async _safeConfigImport(file: string): Promise<any | undefined> {
    try {
      const configRaw = await import(file);
      return configRaw.default;
    } catch (e) {
      this.logger(e);
      return;
    }
  }
}
