import type { NessieConfig } from "../mod.ts";
import { MysqlClient } from "../clients/mysql.ts";

const client = new MysqlClient(
  Deno.env.get("DATABASE_URL") ?? "mysql://root:pwd@localhost:3306/nessie",
);

const config: NessieConfig = { client };

export default config;
