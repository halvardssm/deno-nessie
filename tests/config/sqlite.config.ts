import { nessieConfig } from "../../nessie.config.ts";

const configSqLite: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/../migrations`,
  connection: `tests/data/sqlite.db`,
  dialect: "sqlite",
};

export default configSqLite;
