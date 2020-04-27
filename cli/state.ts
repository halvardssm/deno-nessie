import { _nessieConfig, nessieConfig } from "../nessie.config.ts";
import Denomander from "https://deno.land/x/denomander/mod.ts";
import {
  Client as MySQLClient,
  ClientConfig,
} from "https://deno.land/x/mysql/mod.ts";
import { Client as PGClient } from "https://deno.land/x/postgres/mod.ts";
import { open } from "https://deno.land/x/sqlite/mod.ts";
import { dbDialects } from "../mod.ts";
import { IConnectionParams } from "https://deno.land/x/postgres/connection_params.ts";
import { PGSQL } from "./pgsql.ts";
import { ClientTypes, ClientI } from "./utils.ts";
import { MySQL } from "./mysql.ts";
import { SQLite } from "./sqlite.ts";

export class State {
  private enableDebug: boolean;
  private configFile: string;
  dialect: dbDialects = "pg";
  migrationFolder: string = "";
  private connection: IConnectionParams | ClientConfig | string = "";
  clients: ClientTypes = {};
  client?: ClientI;

  constructor(prog: Denomander) {
    this.enableDebug = prog.debug;
    this.configFile = prog.config;

    this.debug(prog, "Program");
    this.debug(this, "State");
  }

  async init() {
    let configFile;

    try {
      configFile = await import(
        this.configFile || `${Deno.cwd()}/nessie.config.ts`
      );
    } catch (e) {
      configFile = await import("../nessie.config.ts");
    } finally {
      const config: nessieConfig = configFile.default;

      this.debug(config, "Config");

      this.migrationFolder = this._parseMigrationFolder(config.migrationFolder);
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

    await Deno.copyFile(
      "./src/templates/migration.ts",
      `${this.migrationFolder}/${fileName}`,
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
        client = new PGClient((this.connection as string | IConnectionParams));
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

  private _parseMigrationFolder(migrationFolder: string | undefined): string {
    return !migrationFolder
      ? `${Deno.cwd()}/migrations`
      : migrationFolder?.startsWith("/")
        ? migrationFolder
        : migrationFolder.startsWith("./")
          ? `${Deno.cwd()}${migrationFolder.substring(1)}`
          : `${Deno.cwd()}/${migrationFolder}`;
  }
}
