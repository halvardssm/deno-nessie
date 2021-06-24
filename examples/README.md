# Examples

This folder contains examples of how to use this library.

## Config files

The following are minimal example config files:

- [PostgreSQL](./config-postgres.ts)
- [MySQL](./config-mysql.ts)
- [SQLite](./config-sqlite.ts)

If you want to include external migrations, check out these examples:

- [With url](./config-remote-migration-files.ts)
- [With GitHub API](./config-remote-migration-files-github-api.ts) - this
  example uses the github api to get the folder content and parse migration
  files from it.

## Migration files

- [Basic migration](./migration.ts)
- [Migration using Dex](./migration-dex.ts)

## Seed files

- [Basic seed](./seed.ts)
