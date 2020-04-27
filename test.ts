import { open, DB, save } from "https://deno.land/x/sqlite/mod.ts";
import configSqLite from "./nessie.config.ts";

const client = await open("tests/data/sqlite.db");

console.log(
  [...client.query(
    "CREATE TABLE IF NOT EXISTS main.test (col1 INTEGER,col2 CHAR(50));",
    [],
  )],
);

const empthy = [
  ...client.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='test';",
    [],
  ),
];

console.log(empthy);

client.query("INSERT INTO test VALUES (1,'asdf');", []);
client.query("INSERT INTO test VALUES (2,'asdf');", []);

const names = [...client.query("SELECT * from test;", [])];

console.log(names);

save(client);
