# Migrating Denosaurs

![ci](https://github.com/halvardssm/deno-migrating-denos/workflows/ci/badge.svg)

A db migration tool for deno.

## Status / Roadmap

* Currently the cli can be used to create a migration file 
* By using `new Table(config)` you can generate a sql string which you can use to modify your database

* [ ] CLI communicates with db and tracks migrations using a table
* [ ] CLI can rollback a migration
* [ ] CLI can migrate and rollback multiple files
* [ ] Add support for seed files
* [ ] Rework the codebase to have a cleaner interface and chained opperations

## Supported databases

* [ ] PostgreSQL - in development
* [ ] MySQL - not started
* [ ] SQLite - not started

If you have a database system you would like to see in this list, feel free to make an issue or create a pr with your implementation.

## Usage

* Create migration

```deno run --allow-write --allow-read https://denopkg.com/halvardssm/migrating-denos/cli.ts make create_users -p migrations```

* Run migration - under construction, will not work at the moment

```deno run --allow-read --allow-run https://denopkg.com/halvardssm/migrating-denos/cli.ts migrate```

## Contributing

I am looking for someone to help me out with this project, so feel free to make pr's or create an issue!
