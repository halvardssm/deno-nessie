import { dbDialects } from "./mod.ts";

export type nessieConnectionType = {
  host: string | "localhost" | "127.0.0.1";
  port: string | number;
  name: string;
  user: string;
  password?: string;
  dialect?: dbDialects;
};
export type _nessieConnectionType = {
  host: string | "localhost" | "127.0.0.1";
  port: string;
  name: string;
  user: string;
  password?: string;
  dialect: dbDialects;
};
export type nessieConfigType = {
  migrationFolder?: string;
  connection: nessieConnectionType;
  args?: object;
};

export type _nessieConfigType = {
  migrationFolder: string;
  connection: _nessieConnectionType;
  args?: object;
};

const config: nessieConfigType = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: {
    host: "localhost",
    port: 5000,
    user: "root",
    password: "pwd",
    name: "nessie",
    dialect: "pg",
  },
};

export default config;
