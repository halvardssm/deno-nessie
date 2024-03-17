import { dirname, fromFileUrl, resolve } from "@std/path";
import { MySqlMigrationClient } from "../../mod.ts";

export default {
  client: new MySqlMigrationClient("mysql://root@0.0.0.0:5101/nessie"),
  migrationFolders: [
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "mysql1"),
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "mysql2"),
  ],
  seedFolders: [
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "mysql1"),
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "mysql2"),
  ],
};
