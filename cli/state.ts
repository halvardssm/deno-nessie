import {
  ClientConfig,
  ConnectionOptions,
  Denomander,
  MySQLClient,
  open,
  PGClient,
  resolve,
} from "../deps.ts";
import { dbDialects, nessieConfig } from "../mod.ts";
import { MySQL } from "./mysql.ts";
import { PGSQL } from "./pgsql.ts";
import { SQLite } from "./sqlite.ts";
import { ClientI, ClientTypes, parsePath } from "./utils.ts";

const STD_CONFIG_FILE = "nessie.config.ts";
const stdConfig: nessieConfig = {
  migrationFolder: "./migrations",
  connection: {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  },
  dialect: "pg",
};

export class State {
  private enableDebug: boolean;
  private configFile: string;
  dialect: dbDialects = "pg";
  migrationFolder: string = "";
  private connection: ConnectionOptions | ClientConfig | string = "";
  clients: ClientTypes = {};
  client?: ClientI;

  constructor(prog: Denomander) {
    this.enableDebug = prog.debug;
    this.configFile = parsePath(prog.config || STD_CONFIG_FILE);

    this.debug(prog, "Program");
    this.debug(this, "State");
  }

  async init() {
    let config: nessieConfig = stdConfig;
    let configRaw;
    try {
      this.debug("Checking config path");
      configRaw = await import(this.configFile);
      config = configRaw.default;
    } catch (e) {
      try {
        this.debug(e, "Checking project root");

        configRaw = await import(parsePath(STD_CONFIG_FILE));
        config = configRaw.default;
      } catch (er) {
        this.debug(e, "Using standard config");
      }
    } finally {
      this.debug(config, "Config");

      this.migrationFolder = resolve(config.migrationFolder || "migrations");

      this.connection = config.connection;
      this.dialect = config.dialect || "pg";

      this.debug(this, "State init");
    }

    return this;
  }

  async makeMigration(migrationName: string) {
    const fileName = `${Date.now()}-${migrationName}.ts`;

    this.debug(fileName, "Migration file name");

    await Deno.mkdir(this.migrationFolder, { recursive: true });

    const responseFile = await fetch(
      "https://deno.land/x/nessie/cli/templates/migration.ts",
    );

    await Deno.writeTextFile(
      `${this.migrationFolder}/${fileName}`,
      await responseFile.text(),
    );

    console.info(`Created migration ${fileName} at ${this.migrationFolder}`);
  }

  async initClient(): Promise<void> {
    let client;

    switch (this.dialect) {
      case "mysql":
        client = await new MySQLClient().connect(
          (this.connection as ClientConfig),
        );
        this.client = new MySQL(this, client);
        break;

      case "sqlite":
        client = await open((this.connection as string));
        this.client = new SQLite(this, client);
        break;

      case "pg":
      default:
        client = new PGClient((this.connection as string | ConnectionOptions));
        this.debug(client, "PGClient");
        await client.connect();
        this.client = new PGSQL(this, client);
    }

    this.debug(this.client, "Client");
  }

  debug(output?: any, title?: string) {
    if (this.enableDebug) {
      title ? console.log(title + ": ") : null;
      console.log(output);
    }
  }
}
