import { Client, ClientConfig } from "https://deno.land/x/mysql/mod.ts";

const config: ClientConfig = {
  // hostname: "localhost",
  port: 5001,
  username: "root",
  password: "pwd",
  db: "test",
  debug: true,
};

const client = await new Client().connect(config);

console.log(await client.query("select 1 from nessie_migrations limit 1;"));
