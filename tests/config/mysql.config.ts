import { nessieConfig } from "../../nessie.config.ts";

const configMySql: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/../migrations`,
  connection: {
    hostname: "localhost",
    port: 5001,
    username: "root",
    password: "pwd",
    db: "nessie",
  },
  dialect: "mysql",
};

export default configMySql;
