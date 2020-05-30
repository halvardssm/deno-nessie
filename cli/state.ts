import {
  AbstractClient,
  ClientI,
  nessieConfig,
} from "../clients/AbstractClient.ts";
import { ClientPostgreSQL } from "../clients/ClientPostgreSQL.ts";
import { Denomander } from "../deps.ts";
import { parsePath } from "./utils.ts";

export type loggerFn = (output?: any, title?: string) => void;

const STD_CONFIG_FILE = "nessie.config.ts";

export class State {
  private enableDebug: boolean;
  private configFile: string;
  private config?: nessieConfig;
  client?: ClientI;

  constructor(prog: Denomander) {
    this.enableDebug = prog.debug;
    this.configFile = parsePath(prog.config || STD_CONFIG_FILE);

    this.logger([this.enableDebug, this.configFile], "State");
  }

  async init() {
    this.logger("Checking config path");
    this.config = await this._safeConfigImport(this.configFile);

    if (!this.config) {
      this.logger("Checking project root");
      this.config = await this._safeConfigImport(parsePath(STD_CONFIG_FILE));
    }


    if (!this.config?.client) {
      this.logger("Using standard config");

      this.client = new ClientPostgreSQL("./migrations", {
        database: "nessie",
        hostname: "localhost",
        port: 5432,
        user: "root",
        password: "pwd",
      });
    } else {
      this.client = this.config.client;
    }

    this.client?.setLogger(this.logger);

    return this;
  }

  async makeMigration(migrationName: string) {
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

  logger(output?: any, title?: string): void {
    try {
      if (this.enableDebug) {
        title ? console.log(title + ": ") : null;
        console.log(output);
      }
    } catch {
      console.log("Error at: "+title)
    }
  }

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
