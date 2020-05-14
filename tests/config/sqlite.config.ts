import { nessieConfig } from "../../mod.ts";

const configSqLite: nessieConfig = {
  migrationFolder: `${Deno.cwd()}/tests/migrations`,
  connection: `tests/data/sqlite.db`,
  dialect: "sqlite",
};

export default configSqLite;
