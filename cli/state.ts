import { AbstractClient, ClientI } from '../clients/AbstractClient.ts';
import { ClientPostgreSQL } from "../clients/ClientPostgreSQL.ts";
import { Denomander } from "../deps.ts";
import { parsePath } from "./utils.ts";

const STD_CONFIG_FILE = "nessie.config.ts";
const stdConfig = {
  client: new ClientPostgreSQL("./migrations", {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  })
};

export class State {
  private enableDebug: boolean;
  private configFile: string;
  private config = stdConfig;
  client?: ClientI

  constructor(prog: Denomander) {
    this.enableDebug = prog.debug;
    this.configFile = parsePath(prog.config || STD_CONFIG_FILE);

    this.debug(this, "State");
  }

  async init() {
    try {
      this.debug("Checking config path");
      const configRaw = await import(this.configFile);
      this.config = configRaw.default;
    } catch (e) {
      try {
        this.debug(e, "Checking project root");

        const configRaw = await import(parsePath(STD_CONFIG_FILE));
        this.config = configRaw.default;
      } catch (er) {
        this.debug(er, "Using standard config");
      }
    } finally {
      this.debug(this.config, "Config");

      this.client = this.config.client

      this.debug(this, "State init");
    }

    return this;
  }

  async makeMigration(migrationName: string) {
    if (migrationName.length > AbstractClient.MAX_FILE_NAME_LENGTH - 13) throw new Error(`Migration name can't be longer than ${AbstractClient.MAX_FILE_NAME_LENGTH - 13}`)

    const fileName = `${Date.now()}-${migrationName}.ts`;

    this.debug(fileName, "Migration file name");

    await Deno.mkdir(this.config.client.migrationFolder, { recursive: true });

    const responseFile = await fetch(
      "https://deno.land/x/nessie/cli/templates/migration.ts",
    );

    await Deno.writeTextFile(
      `${this.config.client.migrationFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(`Created migration ${fileName} at ${this.config.client.migrationFolder}`);
  }


  debug(output?: any, title?: string) {
    if (this.enableDebug) {
      title ? console.log(title + ": ") : null;
      console.log(output);
    }
  }
}
