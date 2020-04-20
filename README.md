# Nessie

![ci](https://github.com/halvardssm/deno-nessie/workflows/ci/badge.svg)

A db migration tool for deno.

## Status / Roadmap

* Currently the cli can be used to create a migration file and to perform simple migrations and rollbacks
* By using `Schema` you can generate a sql string which you can use to modify your database

* [x] CLI communicates with db and tracks migrations using a table
* [x] CLI can rollback a migration
* [ ] CLI can migrate and rollback multiple files (currently only migrate multiple files)
* [ ] Add support for seed files
* [x] Rework the codebase to have a cleaner interface and chained opperations
* [ ] Add support for soft deletes
* [ ] Add support for env or settings file
* [ ] Add tests

## Supported databases

* [x] PostgreSQL - in development
* [ ] MySQL - not started
* [ ] SQLite - not started

If you have a database system you would like to see in this list, feel free to make an issue or create a pr with your implementation.

## Usage

* Create migration

```deno run --allow-write --allow-read https://denopkg.com/halvardssm/deno-nessie/cli.ts make create_users -p migrations```

* Run migration (under construction, feel free to file any bugs you encounter)

```deno run --allow-read --allow-net https://denopkg.com/halvardssm/deno-nessie/cli.ts migrate -p migrations -c postgres://root:pwd@localhost:5000/nessie```

* Rollback (under construction, feel free to file any bugs you encounter)

```deno run --allow-net --allow-read https://denopkg.com/halvardssm/deno-nessie/cli.ts migrate -p migrations -c postgres://root:pwd@localhost:5000/nessie```

## Contributing

I am looking for someone to help me out with this project, so feel free to make pr's or create an issue!
