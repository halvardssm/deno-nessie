import { nessieConfig } from "../../nessie.config.ts";

const configPg: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/../migrations`,
  connection: {
    host: "localhost",
    port: "5000",
    user: "root",
    password: "pwd",
    database: "nessie",
  },
  dialect: "pg",
};

export default configPg;
