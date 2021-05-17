# Nessie Change Log

## Version 1.3.2

- Fixed bug where path for async import was not a file url

## Version 1.3.1

- Cliffy v0.18.2
- Replaced Denomander with Cliffy
- Added support for multiple migration and seed folders

## Version 1.3.0

- Added `CHANGELOG.md` file
- Removed dex in abstract migration and seed
- Removed ClientI and improved AbstractClient
- Added make:migration command
- removed nessie.config.ts file in root
- Improved types
- Added github funding

## Version 1.2.4

- Fixed broken Nest CI
- Improved types
- Fixed typehint for client in `AbstractMigration` and `AbstractSeed`

## Version 1.2.3

- Deno v1.9.2
- PostgreSQL v0.11.2
- SQLite v2.4.0
- Added format and lint test to CI
- doc fixes
- Improved `updateTimestamps` code
- Made private methods properly private with `#`
- Fixed typo in `egg.json`

## Version 1.2.2

- Updated Nest config

## Version 1.2.1

- Updated Nest CI script to use `denoland/setup-deno` instead of
  `denolib/setup-deno`
- Fixed Nest Nessie link in readme
- Removed query builder from `egg.json`
- Fixed `isUrl` parsing

## Version 1.2.0

- Deno v1.8.3
- Deno std v0.55.0
- PostgreSQL v0.4.6
- MySQL v2.8.0
- SQLite v2.3.0
- Denomander v0.8.1
- Changed branch name from `master` to `main`
- Added VSCode Devcontainer setup
- MD formatting now happens via Deno fmt
- Added Codecoverage file (WIP)
- Transferred QueryBuilder to its own repo
- Added experimental migration names to use `yyyymmddHHMMss` instead of unix
  timestamp
- Improved experimental class based migrations

## Version 1.1.0

- Deno v1.4.4
- Deno std v0.73.0
- PostgreSQL v0.4.5
- MySQL v2.4.0
- SQLite v2.3.0
- Denomander v0.6.3
- Added nest.land to CI
- Improved CI
- Added examples to examples folder and readme
- Added experimental class based migrations
- Improved typings and class properties
- Improved tests

## Version 1.0.0

- Initial release
- Deno v1.0.5
- Deno std v0.55.0
- PostgreSQL v0.4.1
- MySQL v2.2.0
- SQLite v2.0.0
- Denomander v0.6.2
