DB_PG_PORT=5000
DB_MYSQL_PORT=5001
DB_USER=root
DB_PWD=pwd
DB_NAME=nessie

CONFIG_FILE=./nessie.config.ts
DB_URL=postgres://${DB_USER}:${DB_PWD@localhost:${DB_PG_PORT}/${DB_NAME}

migration-%:
	deno run --allow-write --allow-read cli.ts make $* -c ${CONFIG_FILE}
migrate:
	deno run --allow-net --allow-read cli.ts migrate -c ${CONFIG_FILE}
rollback:
	deno run --allow-net --allow-read cli.ts rollback -c ${CONFIG_FILE}

test:
	deno test tests

db-pg-start:
	docker run -d -p $(DB_PG_PORT):5432 -e POSTGRES_USER=$(DB_USER) -e POSTGRES_PASSWORD=$(DB_PWD) -e POSTGRES_DB=${DB_NAME} -v `pwd`/tests/data/pg:/var/lib/postgresql/data --rm --name $(DB_NAME)-pg postgres:latest
db-pg-stop:
	docker kill ${DB_NAME}-pg
db-mysql-start:
	docker run -d -p $(DB_MYSQL_PORT):3306 -e MYSQL_ROOT_PASSWORD=$(DB_PWD) -e MYSQL_DATABASE=${DB_NAME} -v `pwd`/tests/data/mysql:/var/lib/mysql --rm --name $(DB_NAME)-mysql mysql:5
db-mysql-stop:
	docker kill ${DB_NAME}-mysql