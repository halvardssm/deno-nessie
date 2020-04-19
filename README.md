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
* [ ] Rework the codebase to have a cleaner interface and chained.. opperations

## Supported databases

* [ ] PostgreSQL - in development
* [ ] MySQL - not started
* [ ] SQLite - not started

If you have a database system you would like to see in this list, feel free to make an issue or create a pr with your implementation.

## Usage

* Create migration

```deno run --allow-write --allow-read https://denopkg.com/halvardssm/deno-nessie/cli.ts make create_users -p migrations```

* Run migration - under construction, will not work at the moment

```deno run --allow-write --allow-read --allow-net https://denopkg.com/halvardssm/deno-nessie/cli.ts migrate -p migrations```

## Contributing

I am looking for someone to help me out with this project, so feel free to make pr's or create an issue!

## ToDo

| # | id | desc |
|---|---|---|
| &#9745; | $table->id(); | Alias of $table->bigIncrements('id').|
| &#9744; | $table->foreignId('user_id'); | Alias of $table->unsignedBigInteger('user_id').|
| &#9745; | $table->bigIncrements('id'); | Auto-incrementing UNSIGNED BIGINT (primary key) equivalent column.|
| &#9745; | $table->bigInteger('votes'); | BIGINT equivalent column.|
| &#9745; | $table->binary('data'); | BLOB equivalent column.|
| &#9745; | $table->boolean('confirmed'); | BOOLEAN equivalent column.|
| &#9745; | $table->char('name', 100); | CHAR equivalent column with a length.|
| &#9745; | $table->date('created_at'); | DATE equivalent column.|
| &#9745; | $table->dateTime('created_at', 0); | DATETIME equivalent column with precision (total digits).|
| &#9745; | $table->dateTimeTz('created_at', 0); | DATETIME (with timezone) equivalent column with precision (total digits).|
| &#9745; | $table->decimal('amount', 8, 2); | DECIMAL equivalent column with precision (total digits) and scale (decimal digits).|
| &#9745; | $table->double('amount', 8, 2); | DOUBLE equivalent column with precision (total digits) and scale (decimal digits).|
| &#9744; | $table->enum('level', ['easy', 'hard']); | ENUM equivalent column.|
| &#9745; | $table->float('amount', 8, 2); | FLOAT equivalent column with a precision (total digits) and scale (decimal digits).|
| &#9744; | $table->geometry('positions'); | GEOMETRY equivalent column.|
| &#9744; | $table->geometryCollection('positions'); | GEOMETRYCOLLECTION equivalent column.|
| &#9744; | $table->increments('id'); | Auto-incrementing UNSIGNED INTEGER (primary key) equivalent column.|
| &#9744; | $table->integer('votes'); | INTEGER equivalent column.|
| &#9744; | $table->ipAddress('visitor'); | IP address equivalent column.|
| &#9744; | $table->json('options'); | JSON equivalent column.|
| &#9744; | $table->jsonb('options'); | JSONB equivalent column.|
| &#9744; | $table->lineString('positions'); | LINESTRING equivalent column.|
| &#9744; | $table->longText('description'); | LONGTEXT equivalent column.|
| &#9744; | $table->macAddress('device'); | MAC address equivalent column.|
| &#9744; | $table->mediumIncrements('id'); | Auto-incrementing UNSIGNED MEDIUMINT (primary key) equivalent column.|
| &#9744; | $table->mediumInteger('votes'); | MEDIUMINT equivalent column.|
| &#9744; | $table->mediumText('description'); | MEDIUMTEXT equivalent column.|
| &#9744; | $table->morphs('taggable'); | Adds taggable_id UNSIGNED BIGINT and taggable_type VARCHAR equivalent columns.|
| &#9744; | $table->uuidMorphs('taggable'); | Adds taggable_id CHAR(36) and taggable_type VARCHAR(255) UUID equivalent columns.|
| &#9744; | $table->multiLineString('positions'); | MULTILINESTRING equivalent column.|
| &#9744; | $table->multiPoint('positions'); | MULTIPOINT equivalent column.|
| &#9744; | $table->multiPolygon('positions'); | MULTIPOLYGON equivalent column.|
| &#9744; | $table->nullableMorphs('taggable'); | Adds nullable versions of morphs() columns.|
| &#9744; | $table->nullableUuidMorphs('taggable'); | Adds nullable versions of uuidMorphs() columns.|
| &#9744; | $table->nullableTimestamps(0); | Alias of timestamps() method.|
| &#9744; | $table->point('position'); | POINT equivalent column.|
| &#9744; | $table->polygon('positions'); | POLYGON equivalent column.|
| &#9744; | $table->rememberToken(); | Adds a nullable remember_token VARCHAR(100) equivalent column.|
| &#9744; | $table->set('flavors', ['strawberry', 'vanilla']); | SET equivalent column.|
| &#9744; | $table->smallIncrements('id'); | Auto-incrementing UNSIGNED SMALLINT (primary key) equivalent column.|
| &#9744; | $table->smallInteger('votes'); | SMALLINT equivalent column.|
| &#9744; | $table->softDeletes('deleted_at', 0); | Adds a nullable deleted_at TIMESTAMP equivalent column for soft deletes with precision (total digits).|
| &#9744; | $table->softDeletesTz('deleted_at', 0); | Adds a nullable deleted_at TIMESTAMP (with timezone) equivalent column for soft deletes with precision (total digits).|
| &#9744; | $table->string('name', 100); | VARCHAR equivalent column with a length.|
| &#9744; | $table->text('description'); | TEXT equivalent column.|
| &#9744; | $table->time('sunrise', 0); | TIME equivalent column with precision (total digits).|
| &#9744; | $table->timeTz('sunrise', 0); | TIME (with timezone) equivalent column with precision (total digits).|
| &#9744; | $table->timestamp('added_on', 0); | TIMESTAMP equivalent column with precision (total digits).|
| &#9744; | $table->timestampTz('added_on', 0); | TIMESTAMP (with timezone) equivalent column with precision (total digits).|
| &#9744; | $table->timestamps(0); | Adds nullable created_at and updated_at TIMESTAMP equivalent columns with precision (total digits).|
| &#9744; | $table->timestampsTz(0); | Adds nullable created_at and updated_at TIMESTAMP (with timezone) equivalent columns with precision (total digits).|
| &#9744; | $table->tinyIncrements('id'); | Auto-incrementing UNSIGNED TINYINT (primary key) equivalent column.|
| &#9744; | $table->tinyInteger('votes'); | TINYINT equivalent column.|
| &#9744; | $table->unsignedBigInteger('votes'); | UNSIGNED BIGINT equivalent column.|
| &#9744; | $table->unsignedDecimal('amount', 8, 2); | UNSIGNED DECIMAL equivalent column with a precision (total digits) and scale (decimal digits).|
| &#9744; | $table->unsignedInteger('votes'); | UNSIGNED INTEGER equivalent column.|
| &#9744; | $table->unsignedMediumInteger('votes'); | UNSIGNED MEDIUMINT equivalent column.|
| &#9744; | $table->unsignedSmallInteger('votes'); | UNSIGNED SMALLINT equivalent column.|
| &#9744; | $table->unsignedTinyInteger('votes'); | UNSIGNED TINYINT equivalent column.|
| &#9744; | $table->uuid('id'); | UUID equivalent column.|
| &#9744; | $table->year('birth_year'); | YEAR equivalent column.|
