import {
  AbstractClient,
  ClientI,
  nessieConfig,
} from "../clients/AbstractClient.ts";
import { ClientPostgreSQL } from "../clients/ClientPostgreSQL.ts";
import { Denomander } from "../deps.ts";
import { parsePath } from "./utils.ts";

const STD_CONFIG_FILE = "nessie.config.ts";

export class State {
  private enableDebug: boolean;
  private configFile: string;
  private config?: nessieConfig;
  client?: ClientI;

  constructor(prog: Denomander) {
    this.enableDebug = prog.debug;
    this.configFile = parsePath(prog.config || STD_CONFIG_FILE);

    this.debug([this.enableDebug, this.configFile], "State");
  }

  async init() {
    this.debug("Checking config path");
    this.config = await this._safeConfigImport(this.configFile);

    if (!this.config) {
      this.debug("Checking project root");
      this.config = await this._safeConfigImport(parsePath(STD_CONFIG_FILE));
    }

    this.debug(this.config, "Config");

    if (!this.config?.client) {
      this.debug("Using standard config");

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

    this.debug(this, "State init");

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

    this.debug(fileName, "Migration file name");

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

  debug(output?: any, title?: string): void {
    if (this.enableDebug) {
      title ? console.log(title + ": ") : null;
      console.log(output);
    }
  }

  private async _safeConfigImport(file: string): Promise<any | undefined> {
    try {
      const configRaw = await import(file);
      return configRaw.default;
    } catch (e) {
      this.debug(e);
      return;
    }
  }
}
