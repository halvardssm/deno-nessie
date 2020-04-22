export type nessieConnectionType = {
  host: string | "localhost" | "127.0.0.1";
  port: string | number;
  dbName: string;
  user: string;
  password?: string;
};
export type nessieConfigType = {
  migrationFolder?: string;
  connection: string | nessieConnectionType;
};

export type _nessieConfigType = {
  migrationFolder: string;
  connection: nessieConnectionType;
};

const config: nessieConfigType = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: {
    host: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
    dbName: "nessie",
  },
};

export default config;
