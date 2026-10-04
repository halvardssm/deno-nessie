# Examples

The examples import from this repository, so they are type checked with it
(`deno task type:check`) and the migrations and seed are run on SQLite, Postgres
and MySQL by the tests. In your own project, import from `jsr:@halvardm/nessie`
instead of `../mod.ts`.

| File                                                                             | Shows                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [config-sqlite.ts](./config-sqlite.ts)                                           | A config file for SQLite.                                                       |
| [config-postgres.ts](./config-postgres.ts)                                       | A config file for Postgres, with a URL from the environment and driver options. |
| [config-mysql.ts](./config-mysql.ts)                                             | A config file for MySQL and MariaDB.                                            |
| [config-remote-and-custom-templates.ts](./config-remote-and-custom-templates.ts) | Migrations and seeds from URLs, and custom templates for the `make` commands.   |
| [migration.ts](./migration.ts)                                                   | A migration, with `up` and `down`.                                              |
| [migration-dialects.ts](./migration-dialects.ts)                                 | SQL that differs between databases, and `transaction`.                          |
| [seed.ts](./seed.ts)                                                             | A seed.                                                                         |
| [custom-client.ts](./custom-client.ts)                                           | A client implementing `NessieClient`, with its own migration table.             |
| [library.ts](./library.ts)                                                       | Using `MigrationClient` without the CLI.                                        |

Use a config file with `-c`, e.g. `nessie migrate -c examples/config-sqlite.ts`.
