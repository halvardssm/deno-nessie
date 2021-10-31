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
- [With custom templates](./config-custom-templates.ts) - this example uses
  custom templates and shows how to deal with custom abstract classes.

## Migration files

- [Basic migration](./migration.ts)
- [Migration using Dex](./migration-dex.ts)
- [Custom AbstractMigration](./abstract-classes-extended.ts)

## Seed files

- [Basic seed](./seed.ts)
- [Custom AbstractSeed](./abstract-classes-extended.ts)
