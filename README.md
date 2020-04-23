# Nessie

![ci](https://github.com/halvardssm/deno-nessie/workflows/ci/badge.svg)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/nessie/mod.ts)

A database migration tool for [deno](https://deno.land) inspired by [Laravel](https://github.com/laravel/laravel). Supports PostgreSQL and  MySQL, soon: SQLite. See [documentation](https://doc.deno.land/https/deno.land/x/nessie/mod.ts).

## Status / Roadmap

* Currently the cli can be used to create a migration file and to perform simple migrations and rollbacks
* By using `Schema` you can generate a sql string which you can use to modify your database

* [x] CLI communicates with db and tracks migrations using a table
* [x] CLI can rollback a migration
* [x] Rework the codebase to have a cleaner interface and chained opperations
* [x] Add support for env or settings file
* [x] Add tests
* [ ] CLI can migrate and rollback multiple files (currently only migrate multiple files)
* [ ] Add support for seed files
* [ ] Add support for soft deletes
* [ ] Add rename method for table
* [ ] Add rename method for column
* [ ] Add drop method for column
* [ ] Add unsigned method for integers
* [ ] Add alter method for schema
* [ ] Add support for foreign key contraints
* [ ] Add integration test with databases

## Supported databases

* [x] PostgreSQL - in beta
* [x] MySQL - in alpha
* [ ] SQLite - not started

If you have a database system you would like to see in this list, feel free to make an issue or create a pr with your implementation.

## Usage

* `make`: Create migration

```deno run --allow-read --allow-write https://deno.land/x/nessie/cli.ts make create_users -p migrations```

* `migrate`: Run migration - will migrate all migrations in your migration folder newer than the latest migration in your db

```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts migrate -p migrations -c postgres://root:pwd@localhost:5000/nessie```

* `rollback`: Rollback - will rollback the latest migration

```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts migrate -p migrations -c postgres://root:pwd@localhost:5000/nessie```

### Flags

* `-p, --path`: path to migration folder
* `-c, --connection`: db connection url

## Contributing

Feel free to make pr's or create an issue!

## Uses

* [Denomander](https://deno.land/x/denomander/)
* [Deno Postgres](https://deno.land/x/postgres/)
* [Deno MySQL](https://deno.land/x/mysql/)
* [Deno SQLite](https://deno.land/x/sqlite/)

## Examples

`nessie.config.json`

```ts
import { nessieConfigType } from "https://deno.land/x/nessie/mod.ts";

const config: nessieConfigType = {
  migrationFolder: "./migrations",
  connection: {
    host: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
    name: "nessie",
    dialect: "pg",
  },
};

export default config;
```

Minimal example of a migration file

```ts
import { Schema } from "https://deno.land/x/nessie/mod.ts";

export const up = (scema: Schema): void => {
  scema.create("users", (table) => {
    table.id();
    table.string("name", 100).nullable();
    table.boolean("is_true").default("false");
    table.custom("custom_column int default 1");
    table.timestamps();
  });

  scema.queryString(
    "INSERT INTO users VALUES (DEFAULT, 'Deno', true, 2, DEFAULT, DEFAULT);",
  );
};

export const down = (schema: Schema): void => {
  schema.drop("users");
};
```

See example folder for more (in development)

### Column types
* 
