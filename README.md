![ci](https://github.com/halvardssm/deno-nessie/workflows/ci/badge.svg)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/nessie/mod.ts)
[![(Deno)](https://img.shields.io/badge/deno-1.0.4-green.svg)](https://deno.land)

# Nessie

<p align="center"><img src="./.github/logo.png" alt="Nessie logo" width="200" height="200"></p>

A modular database migration tool for [Deno](https://deno.land) inspired by [Laravel](https://github.com/laravel/laravel). Supports PostgreSQL,  MySQL and SQLite. 

See documentation for the [query builder](https://doc.deno.land/https/deno.land/x/nessie/qb.ts). \
See documentation for the [clients](https://doc.deno.land/https/deno.land/x/nessie/mod.ts).

## Supported databases

* [x] PostgreSQL
* [x] MySQL - Currently it works with password for 5.*, but for >=8 you have to send a blank password, see [Deno MySQL](https://deno.land/x/mysql/) for version support
* [x] SQLite

If you have a database system you would like to see in this list, feel free to make an issue or create a pr with your implementation. 

You can see examples of how to make a client plugin in the [clients folder](./clients) or in the section [How to make a client](#how-to-make-a-client).

## Usage

* `init`: Generates a `nessie.config.ts` file

  ```deno run --allow-net --allow-read --allow-write https://deno.land/x/nessie/cli.ts init```

* `make [name]`: Create migration

  ```deno run --allow-net --allow-read --allow-write https://deno.land/x/nessie/cli.ts make create_users```

* `migrate [amount?]`: Run migration - will migrate your migrations in your migration folder (sorted by timestamp) newer than the latest migration in your db. Amount defines how many migrations, defaults to all available if not set.

  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts migrate```
  
  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts migrate 1```

  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts migrate -c ./nessie.config.ts```

* `rollback [amount?]`: Rollback - will rollback your migrations. Amount defines how many migrations, defaults to 1 if not set.

  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts rollback```
  
  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts rollback 2```

  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts rollback all```

### Flags

* `-c, --config`: Path to config file, will default to ./nessie.config.ts
* `-d, --debug`: Enables verbose output

## Contributing

All contributions are welcome, make sure to read the [contributing guideline](./.github/CONTRIBUTING.md).

## Uses

* [Denomander](https://deno.land/x/denomander/)
* [Deno Postgres](https://deno.land/x/postgres/)
* [Deno MySQL](https://deno.land/x/mysql/)
* [Deno SQLite](https://deno.land/x/sqlite/)

## Examples

`nessie.config.ts`

```ts
import { ClientPostgreSQL, nessieConfig } from "https://deno.land/x/nessie/mod.ts"; 

const migrationFolder = "./migrations";

const config: nessieConfig = {
  client: new ClientPostgreSQL(migrationFolder, {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  }),
};

export default config;
```

Minimal example of a migration file

```ts
import { Migration } from "https://deno.land/x/nessie/mod.ts";

export const up: Migration = () => {
  return "CREATE TABLE table1 (id int);";
};

export const down: Migration = () => {
  return "DROP TABLE table1";
};
```

Using the native query builder

```ts
import { Migration } from "https://deno.land/x/nessie/mod.ts";
import { Schema, dbDialects } from "https://deno.land/x/nessie/qb.ts";

const dialect: dbDialects = "mysql"

export const up: Migration = () => {
  const queryArray: string[] = new Schema(dialect).create("users", (table) => {
    table.id();
    table.string("name", 100).nullable();
    table.boolean("is_true").default("false");
    table.custom("custom_column int default 1");
    table.timestamps();
  });

  const queryString = new Schema(dialect).queryString(
    "INSERT INTO users VALUES (DEFAULT, 'Deno', true, 2, DEFAULT, DEFAULT);",
  )
  
  queryArray.push(queryString);

  return queryArray
};

export const down: Migration = () => {
  return new Schema(dialect).drop("users");
};
```

See the [example folder](./examples) for more

## How to make a client

A client needs to extend [AbstractClient](./clients/AbstractClient.ts) and implement the [ClientI interface](./clients/AbstractClient.ts).

`query`: Takes a query string or array of query strings and sends them of to the batabase for execution. Should return whatever the database responds.

`prepare`: Will be run when the migration or rollback commands are executed. This should create the connection, set up the `nessie_migrations` table and prepare the database for incoming migrations.

`migrate`: Takes a number as an optional input, will default to all files if not set. Will run `Math.min(amount, numberOfFiles)` migration files. Only handles the `up` method.

`rollback`: Takes a number as an optional input, will default to 1 if not set. Will run `Math.min(amount, numberOfFiles)` migration files. Only handles the `down` method.

`close`: Will be the last method run before the program is finished. This should close the database connection.
