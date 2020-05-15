![ci](https://github.com/halvardssm/deno-nessie/workflows/ci/badge.svg)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/nessie/mod.ts)
[![(Deno)](https://img.shields.io/badge/deno-1.0.0-green.svg)](https://deno.land)

# Nessie

<p align="center"><img src="./.github/logo.png" alt="Nessie logo" width="200" height="200"></p>

A database migration tool for [deno](https://deno.land) inspired by [Laravel](https://github.com/laravel/laravel). Supports PostgreSQL and  MySQL, soon: SQLite. See [documentation](https://doc.deno.land/https/deno.land/x/nessie/mod.ts).

## Supported databases

* [x] PostgreSQL
* [x] MySQL - Currently it works with password for 5.*, but for >=8 you have to send a blank password, see [Deno MySQL](https://deno.land/x/mysql/) for version support
* [x] SQLite

If you have a database system you would like to see in this list, feel free to make an issue or create a pr with your implementation.

## Usage

* `init`: Generates a `nessie.config.ts` file

  ```deno run --allow-net --allow-read --allow-write https://deno.land/x/nessie/cli.ts init```

* `make [name]`: Create migration

  ```deno run --allow-net --allow-read --allow-write https://deno.land/x/nessie/cli.ts make create_users```

* `migrate`: Run migration - will migrate all migrations in your migration folder (sorted by timestamp) newer than the latest migration in your db

  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts migrate```

  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts migrate -c ./nessie.config.ts```

* `rollback`: Rollback - will rollback the latest migration

  ```deno run --allow-net --allow-read https://deno.land/x/nessie/cli.ts rollback```

### Flags

* `-c, --config`: Path to config file, will default to ./nessie.config.ts
* `-d, --debug`: Enables verbose output

## Contributing

Feel free to make pr's or create an issue!

## Uses

* [Denomander](https://deno.land/x/denomander/)
* [Deno Postgres](https://deno.land/x/postgres/)
* [Deno MySQL](https://deno.land/x/mysql/)
* [Deno SQLite](https://deno.land/x/sqlite/)

## Examples

`nessie.config.ts`

```ts
import { nessieConfigType } from "https://deno.land/x/nessie/mod.ts";

const config: nessieConfigType = {
  migrationFolder: "./migrations",
  connection: { // These are the connection option from their respective db clients, will differ
    host: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
    name: "nessie",
  },
  dialect: "pg",
};

export default config;
```

Minimal example of a migration file

```ts
import { Schema } from "https://deno.land/x/nessie/mod.ts";

export const up = (schema: Schema): void => {
  schema.create("users", (table) => {
    table.id();
    table.string("name", 100).nullable();
    table.boolean("is_true").default("false");
    table.custom("custom_column int default 1");
    table.timestamps();
  });

  schema.queryString(
    "INSERT INTO users VALUES (DEFAULT, 'Deno', true, 2, DEFAULT, DEFAULT);",
  );
};

export const down = (schema: Schema): void => {
  schema.drop("users");
};
```

See example folder for more
