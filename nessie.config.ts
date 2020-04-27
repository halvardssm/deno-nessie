import { dbDialects } from "./mod.ts";
import { IConnectionParams } from "https://deno.land/x/postgres/connection_params.ts";
import { ClientConfig } from "https://deno.land/x/mysql/src/client.ts";

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
  migrationFolder: `${Deno.cwd()}/tests/migrations`,
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
  migrationFolder: `${Deno.cwd()}/tests/migrations`,
  connection: {
    hostname: "localhost",
    port: 5001,
    username: "root",
    password: "pwd",
    db: "nessie",
  },
  dialect: "mysql",
};

export default configPg;
