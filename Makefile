MIGRATION_FOLDER=tests/migrations
DB_URL=postgres://root:pwd@localhost:5000/nessie

migration-%:
	deno run --allow-write --allow-read cli.ts make $* -p ${MIGRATION_FOLDER}
migrate:
	deno run --allow-net --allow-read cli.ts migrate -p ${MIGRATION_FOLDER} -c ${DB_URL}
rollback:
	deno run --allow-net --allow-read cli.ts rollback -p ${MIGRATION_FOLDER} -c ${DB_URL}