<h1 align="center">Nessie</h1>

<p align="center">
  A database migration tool for Deno, built on
  <a href="https://jsr.io/@stdext/database">@stdext/database</a>.
</p>

<p align="center">
  <a href="https://jsr.io/@halvardm/nessie"><img alt="JSR" src="https://jsr.io/badges/@halvardm/nessie"></a>
  <a href="https://github.com/halvardssm/deno-nessie/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/halvardssm/deno-nessie/actions/workflows/ci.yml/badge.svg"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/github/license/halvardssm/deno-nessie"></a>
</p>

Nessie runs versioned `up`/`down` migrations and seeds on SQLite, Postgres and
MySQL. Migrations receive a standard `@stdext/database` client, so any SQL,
query builder or helper written for that interface works inside them.

> **Upgrading from 2.x?** See [Migrating from 2.x](#migrating-from-2x).

## Contents

- [Quick start](#quick-start)
- [CLI](#cli)
- [Config file](#config-file)
- [Migrations and seeds](#migrations-and-seeds)
- [Clients](#clients)
- [Remote files and custom templates](#remote-files-and-custom-templates)
- [Using Nessie as a library](#using-nessie-as-a-library)
- [Migrating from 2.x](#migrating-from-2x)
- [Contributing](#contributing)

## Quick start

```sh
deno run -A jsr:@halvardm/nessie/cli init --dialect sqlite
deno run -A jsr:@halvardm/nessie/cli make:migration --name create_users
# edit db/migrations/<timestamp>_create_users.ts
deno run -A jsr:@halvardm/nessie/cli migrate
```

Or install it:

```sh
deno install -g -A -n nessie jsr:@halvardm/nessie/cli
nessie init --dialect postgres
```

## CLI

Every command except `init` accepts `-c, --config <path or URL>` (default
`./nessie.config.ts`) and `-d, --debug`. Options are written after the command.

Nessie has no positional arguments: what a command needs is a flag, with a short
alias.

```sh
nessie make:migration --name create_users   # -n
nessie make:seed -n users
nessie migrate --amount 2                   # -a, the next two migrations
nessie rollback -a all                      # -a, every applied migration
nessie seed --matcher users                 # -m, a file name or a RegExp
nessie <command> --help                     # all options of a command
```

Using the old positional form, e.g. `nessie migrate 2`, fails with an error
instead of being ignored.

| Command                  | Description                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `init`                   | Creates the config file and the migration and seed folders. `--mode config\|folders` creates only one, `--dialect sqlite\|postgres\|mysql` picks the client. |
| `make:migration`, `make` | Creates `db/migrations/<yyyyMMddHHmmss>_<name>.ts`. `--name` (`-n`) is required, in lower snake case with digits.                                            |
| `make:seed`              | Creates `db/seeds/<name>.ts`. `--name` (`-n`) is required.                                                                                                   |
| `migrate`                | Runs pending migrations, oldest first. `--amount` (`-a`) limits how many, all pending without it.                                                            |
| `rollback`               | Reverts applied migrations, newest first. `--amount` (`-a`) is a number or `all`, one without it.                                                            |
| `seed`                   | Runs seeds whose file name equals, or matches as a RegExp, `--matcher` (`-m`). All without it.                                                               |
| `status`                 | Shows the available, applied, pending and modified migrations. `--output json`, `--file-names`.                                                              |

The `make` commands also take `--folder <dir>` to choose between several
configured folders (the first one by default), `--force` to overwrite an
existing file, and `--migration-template` / `--seed-template`.

Nessie needs `--allow-read` and `--allow-write` for files, and `--allow-net` for
Postgres and MySQL. `-A` is the simplest.

## Config file

The config file default exports a `NessieConfig`:

```ts
import type { NessieConfig } from "jsr:@halvardm/nessie";
import { SqliteClient } from "jsr:@halvardm/nessie/clients/sqlite";

const config: NessieConfig = {
  client: new SqliteClient("./sqlite.db"),
  migrationFolders: ["./db/migrations"], // default
  seedFolders: ["./db/seeds"], // default
};

export default config;
```

| Option                                            | Description                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `client`                                          | A client implementing `NessieClient`, e.g. `SqliteClient`. Required. |
| `migrationFolders`, `seedFolders`                 | Folders with the files, relative to the working directory.           |
| `additionalMigrationFiles`, `additionalSeedFiles` | Extra files, anything `import()` accepts, such as URLs.              |
| `migrationTemplate`, `seedTemplate`               | Path or URL of a template used by the `make` commands.               |
| `debug`                                           | Verbose output, same as `--debug`.                                   |

See [examples](./examples) for Postgres, MySQL, remote files and a custom
client.

## Migrations and seeds

A migration is the default export of `<yyyyMMddHHmmss>_<name>.ts`. Each
migration runs in a transaction together with its entry in the
`nessie_migrations` table, so a failing migration is not recorded.

```ts
import type { Migration } from "jsr:@halvardm/nessie";

export default {
  async up({ client }) {
    await client.execute(
      "CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL)",
    );
  },
  async down({ client }) {
    await client.execute("DROP TABLE users");
  },
} satisfies Migration;
```

`client` is an `@stdext/database` `Queryable` (`execute`, `query`,
`executeScript`, `prepare`, nested `transaction`s) and `dialect` describes the
database (`dialect.name`, `dialect.placeholder(i)`,
`dialect.quoteIdentifier()`), for SQL that differs between databases.

Set `transaction: false` on a migration for statements that can not run in a
transaction. **MySQL commits DDL statements implicitly**, so a migration
changing the schema can not be rolled back there, with or without a transaction.

Nessie stores a SHA-256 checksum of each migration file when it is applied. If a
file is edited afterwards, `nessie migrate` and `nessie status` print a warning,
and `status` reports `modifiedMigrations`. Nothing is blocked, since the edit
may be a harmless comment. Line endings are ignored, so a checkout with other
line endings is not a change. Migrations applied by an earlier version have no
checksum; they are given the checksum of the current file the next time
`migrate` runs.

A seed is the default export of a file in a seed folder:

```ts
import type { Seed } from "jsr:@halvardm/nessie";

export default {
  async run({ client }) {
    await client.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");
  },
} satisfies Seed;
```

## Clients

| Database | Import                                  | Backed by                                                       |
| -------- | --------------------------------------- | --------------------------------------------------------------- |
| SQLite   | `jsr:@halvardm/nessie/clients/sqlite`   | `node:sqlite` via `@stdext/database`                            |
| Postgres | `jsr:@halvardm/nessie/clients/postgres` | [postgres](https://github.com/porsager/postgres)                |
| MySQL    | `jsr:@halvardm/nessie/clients/mysql`    | [mysql2](https://sidorares.github.io/node-mysql2), also MariaDB |

All clients take a connection URL and the standard client options, and pass
driver specific options through `connectionOptions.driverOptions`:

```ts
new PostgresClient("postgres://user:pwd@localhost:5432/db", {
  connectionOptions: { driverOptions: { ssl: "require" } },
});
new MysqlClient("mysql://user:pwd@localhost:3306/db");
new SqliteClient("./sqlite.db");
```

The Postgres and MySQL clients implement the `@stdext/database` driver interface
and pass its conformance suite. Notes:

- `BIGINT` is read as a `number` when it is a safe integer and as a `bigint`
  otherwise.
- Postgres and MySQL have no named parameters; use `$1` and `?` placeholders.
- MySQL `execute` and `query` do not reject multiple statements.
- Stopping a MySQL result early cancels the query on the server (`KILL QUERY`,
  from a second short-lived connection), instead of receiving the unread rows.

### Writing a client

The `client` must implement `NessieClient`: an `@stdext/database` `Client` which
also keeps the table of applied migrations. Nessie itself contains no SQL, so
everything database specific lives in the client:

```ts
interface NessieClient extends Client {
  createMigrationTable(db: Queryable): Promise<void>; // create or update, repeatedly safe
  getAppliedMigrations(db: Queryable): Promise<AppliedMigration[]>; // newest first
  addMigration(db: Queryable, name: string, checksum: string): Promise<void>;
  removeMigration(db: Queryable, name: string): Promise<void>;
  setChecksum(db: Queryable, name: string, checksum: string): Promise<void>;
}
```

`db` is the connection or transaction nessie is running the migration on, so the
record is committed together with the migration. To support another database,
extend its `@stdext/database` client and implement these five methods, as the
clients in [clients/](./clients) do. The plain clients of `@stdext/database` do
not implement the interface, and are rejected with an error that says so. See
[examples/custom-client.ts](./examples/custom-client.ts) for a complete client.

## Remote files and custom templates

`additionalMigrationFiles` and `additionalSeedFiles` accept URLs, so migrations
can be shared as modules. The file name must still be a valid migration name.

`make:migration` and `make:seed` write the content of a template file instead of
the default when `migrationTemplate` / `seedTemplate` is configured, or
`--migration-template` / `--seed-template` is passed. The flag has precedence.

## Using Nessie as a library

The CLI is a thin layer over `MigrationClient`, which can be used directly, for
example to migrate on startup or in tests:

```ts
import { MigrationClient } from "jsr:@halvardm/nessie";
import { SqliteClient } from "jsr:@halvardm/nessie/clients/sqlite";

await using client = new SqliteClient("./sqlite.db");
const migrations = new MigrationClient(client, {
  // Anything `import()` accepts: { name: "<yyyyMMddHHmmss>_<name>.ts", path: "file:///..." }
  migrationFiles,
  info: (message) => console.info(message),
  warn: (message) => console.warn(message),
});

await migrations.migrate(); // or migrate(2)
await migrations.rollback(); // or rollback("all")
await migrations.getApplied(); // names, newest first
await migrations.getModified(); // applied, but the file has been edited since
await migrations.seed("users"); // a name or a RegExp
```

See [examples/library.ts](./examples/library.ts) for a runnable version.

## Migrating from 2.x

Nessie 3 is a rewrite on `@stdext/database`, and is a breaking change.

- **Clients:** `ClientPostgreSQL`, `ClientMySQL`, `ClientMySQL55` and
  `ClientSQLite` are replaced by `PostgresClient`, `MysqlClient` and
  `SqliteClient` from `jsr:@halvardm/nessie/clients/*`. They take a connection
  URL instead of the options of the underlying library. Options of `mysql2`,
  such as authentication plugins, go in `connectionOptions.driverOptions`.
- **Migrations and seeds:** classes extending `AbstractMigration` /
  `AbstractSeed` are replaced by default exported objects with `up`/`down`/`run`
  that receive `{ client, dialect }`. The client is the `@stdext/database`
  interface, not the underlying library's.
- **CLI:** built on `@stdext/cli`. Arguments are now flags, and the positional
  forms are rejected (see the table below). Prompts are replaced by `--folder`
  and `--force`, `--migrationTemplate` is `--migration-template`, and
  `--seedTemplate` is `--seed-template`. `update_timestamps` and the Docker
  image are removed.

  | 2.x                             | 3.x                                      |
  | ------------------------------- | ---------------------------------------- |
  | `nessie make:migration <name>`  | `nessie make:migration --name <name>`    |
  | `nessie make:seed <name>`       | `nessie make:seed --name <name>`         |
  | `nessie migrate [amount]`       | `nessie migrate --amount <amount>`       |
  | `nessie rollback [amount\|all]` | `nessie rollback --amount <amount\|all>` |
  | `nessie seed [matcher]`         | `nessie seed --matcher <matcher>`        |

- **Distribution:** published to [JSR](https://jsr.io/@halvardm/nessie) instead
  of deno.land/x and nest.land.
- **Database:** existing `nessie_migrations` tables keep working. A nullable
  `checksum` column is added the first time Nessie 3 runs. Migration files from
  2.x with millisecond timestamps must have been converted with the 2.x
  `update_timestamps` command.

## Contributing

Pull requests are welcome. The tests need Postgres and MySQL, which
`tests/compose.yml` starts (with Docker or Podman):

```sh
deno task db:start   # Postgres on 5100, MySQL on 5101
deno task test
deno task db:stop
deno task test:all   # all three of the above

deno task check      # format, lint and types
deno task fix        # format, and fix what lint can
```

Set `NESSIE_TEST_POSTGRES` and `NESSIE_TEST_MYSQL` to use other databases.

## License

[MIT](./LICENSE)
