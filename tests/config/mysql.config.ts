import { nessieConfig } from "../../nessie.config.ts";

const configMySql: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/tests/migrations`,
  connection: {
    hostname: "localhost",
    port: 5001,
    username: "root",
    db: "nessie",
  },
  dialect: "mysql",
};

export default configMySql;
