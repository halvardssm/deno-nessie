# Migrating Denosaurs

![ci](https://github.com/halvardssm/migrating-denos/workflows/ci/badge.svg)

A db migration tool for deno.

## Status

* Currently the cli can be used to create a migration file 
* By using `new Table(config)` you can generate a sql string which you can use to modify your database

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
