import { dbDialects } from "./mod.ts";
import { IConnectionParams, ClientConfig } from "./deps.ts";

export interface nessieConnection {
  host: string | "localhost" | "127.0.0.1";
  port: string | number;
  name: string;
  user: string;
  password?: string;
}

export interface nessieConfig {
  connection: IConnectionParams | string | ClientConfig;
  migrationFolder?: string;
  dialect?: dbDialects;
}

export interface _nessieConfig {
  migrationFolder: string;
  dialect: dbDialects;
  connection: {
    pg?: IConnectionParams | string;
    mysql?: ClientConfig;
    sqlite?: string;
  };
}

const configPg: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: {
    host: "localhost",
    port: "5000",
    user: "root",
    password: "pwd",
    database: "nessie",
  },
  dialect: "pg",
};

const configMySql: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: {
    hostname: "localhost",
    port: 5001,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
  },
  dialect: "mysql",
};

const configSqLite: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: "sqlite.db",
  dialect: "sqlite",
};

export default configPg;
