# Nessie Change Log

## Version 2.0.9 - 2022-10-23

- Deno v1.26.2
- Deno std v0.160.0
- PostgreSQL v0.17.0

## Version 2.0.8 - 2022-10-06

- Deno v1.26.0
- Deno std v0.159.0
- Cliffy v0.25.2
- SQLite v3.5.0
- Added schedule ci script to test on regular intervals
- Removed devcontainer

## Version 2.0.7 - 2022-07-31

- Deno v1.24.1
- Deno std v0.150.0
- Cliffy v0.24.3
- PostgreSQL v0.16.1
- Support for CockroachDB with the PostgreSQL client

## Version 2.0.6 - 2022-04-15

- Refactored comands so that Nessie can run programatically

## Version 2.0.5 - 2022-01-11

- Deno v1.17.2
- Deno std v0.119.0
- Cliffy v0.20.1
- MySQL v2.10.2
- PostgreSQL v0.14.2
- SQLite v3.2.0
- Changed client queries from private constants to getters
- Added client for MySQL 5.5

## Version 2.0.4 - 2021-10-31

- Added support for custom seed and migration templates

## Version 2.0.3 - 2021-10-30

- Deno v1.15.3
- Deno std v0.113.0
- Cliffy v0.20.0
- Improved readme

## Version 2.0.2 - 2021-09-28

- Deno v1.14.1
- Deno std v0.108.0
- Cliffy v0.19.6
- MySQL v2.10.1
- Improved constructor type for clients

## Version 2.0.1 - 2021-08-30

- Deno v1.13.2
- Deno std v0.104.0
- Cliffy v0.19.5
- MySQL v2.10.0
- PostgreSQL v0.12.0
- SQLite v3.1.1
- Added status command
- Added sponsor notice

## Version 2.0.0 - 2021-06-24

- Deno v1.11.2
- Deno std v0.99.0
- Cliffy v0.19.2
- MySQL v2.9.0
- Added Coverage reporting
- Limit filenames to only be lowercase, underscore and digits
- Fixed parsing of migrate and rollback amount
- Added Docker image
- Improved output for migration, rollback and seeding
- Added NessieError to give clearity to the errors origin
- Removed fallback of config file to root
- Templates are now strings and will no longer be fetched from remote
- Fixed test
  - Added unit tests
  - Moved existing tests to integration test folder
- Updated CLI options and commands
- Renamed sqlite3 to sqlite
- Changed badges to for-the-badge style

## Version 1.3.2 - 2021-05-17

- Deno v1.10.1
- Fixed bug where path for async import was not a file url

## Version 1.3.1 - 2021-05-08

- Cliffy v0.18.2
- Replaced Denomander with Cliffy
- Added support for multiple migration and seed folders

## Version 1.3.0 - 2021-05-08

- Added `CHANGELOG.md` file
- Removed dex in abstract migration and seed
- Removed ClientI and improved AbstractClient
- Added make:migration command
- removed nessie.config.ts file in root
- Improved types
- Added github funding

## Version 1.2.4 - 2021-04-30

- Fixed broken Nest CI
- Improved types
- Fixed typehint for client in `AbstractMigration` and `AbstractSeed`

## Version 1.2.3 - 2021-04-29

- Deno v1.9.2
- PostgreSQL v0.11.2
- SQLite v2.4.0
- Added format and lint test to CI
- doc fixes
- Improved `updateTimestamps` code
- Made private methods properly private with `#`
- Fixed typo in `egg.json`

## Version 1.2.2 - 2021-04-12

- Updated Nest config

## Version 1.2.1 - 2021-04-27

- Updated Nest CI script to use `denoland/setup-deno` instead of
  `denolib/setup-deno`
- Fixed Nest Nessie link in readme
- Removed query builder from `egg.json`
- Fixed `isUrl` parsing

## Version 1.2.0 - 2021-04-12

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

## Version 1.1.0 - 2020-10-07

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

## Version 1.0.0 - 2020-06-10

- Initial release
- Deno v1.0.5
- Deno std v0.55.0
- PostgreSQL v0.4.1
- MySQL v2.2.0
- SQLite v2.0.0
- Denomander v0.6.2
