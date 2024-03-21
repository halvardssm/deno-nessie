import { dirname, fromFileUrl, resolve } from "@std/path";
import { PostgresMigrationClient } from "../../mod.ts";

export default {
  client: new PostgresMigrationClient({
    client: ["postgresql://root:pwd@0.0.0.0:5100/nessie"],
  }),
  migrationFolders: [
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "pg1"),
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "pg2"),
  ],
  seedFolders: [
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "pg1"),
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "pg2"),
  ],
};
