import type { NessieConfig } from "../mod.ts";
import { PostgresClient } from "../clients/postgres.ts";

const client = new PostgresClient(
  Deno.env.get("DATABASE_URL") ?? "postgres://root:pwd@localhost:5432/nessie",
  // Driver specific options, e.g. TLS
  { connectionOptions: { driverOptions: { ssl: false } } },
);

const config: NessieConfig = { client };

export default config;
