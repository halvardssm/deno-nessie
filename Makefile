DB_PORT=5000
DB_USER=root
DB_PWD=pwd
DB_NAME=nessie

MIGRATION_FOLDER=tests/migrations
DB_URL=postgres://${DB_USER}:${DB_PWD@localhost:${DB_PORT}/${DB_NAME}

migration-%:
	deno run --allow-write --allow-read cli.ts make $* -p ${MIGRATION_FOLDER}
migrate:
	deno run --allow-net --allow-read cli.ts migrate -p ${MIGRATION_FOLDER} -c ${DB_URL}
rollback:
	deno run --allow-net --allow-read cli.ts rollback -p ${MIGRATION_FOLDER} -c ${DB_URL}

test:
	deno test tests

db-start:
	docker run -d -p $(DB_PORT):5432 -e POSTGRES_USER=$(DB_USER) -e POSTGRES_PASSWORD=$(DB_PWD) -e POSTGRES_DB=${DB_NAME} -v `pwd`/data:/var/lib/postgresql/data --rm --name $(DB_NAME) postgres:latest
db-stop:
	docker kill ${DB_NAME}