import { dirname, fromFileUrl, resolve } from "@std/path";
import { SqLiteMigrationClient } from "../../mod.ts";

export default {
  client: new SqLiteMigrationClient({
    client: ["./tests/data/sqlite.db"],
  }),
  migrationFolders: [
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "sqlite1"),
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "sqlite2"),
  ],
  seedFolders: [
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "sqlite1"),
    resolve(dirname(fromFileUrl(new URL(import.meta.url))), "sqlite2"),
  ],
};
