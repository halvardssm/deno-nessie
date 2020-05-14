import { nessieConfig } from "../../mod.ts";

const configPg: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/tests/migrations`,
  connection: {
    database: "nessie",
    hostname: "localhost",
    port: 5000,
    user: "root",
    password: "pwd",
  },
  dialect: "pg",
};

export default configPg;
