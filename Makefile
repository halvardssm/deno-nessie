DB_PG_PORT=5000
DB_MYSQL_PORT=5001
DB_USER=root
DB_PWD=pwd
DB_NAME=nessie

CONFIG_FILE=./tests/config/mysql.config.ts
DB_URL=postgres://${DB_USER}:${DB_PWD@localhost:${DB_PG_PORT}/${DB_NAME}

migration-%:
	deno run --allow-write --allow-read --allow-net cli.ts make $* -c ${CONFIG_FILE}
migrate:
	deno run --allow-net --allow-read cli.ts migrate -c ${CONFIG_FILE}
rollback:
	deno run --allow-net --allow-read cli.ts rollback -c ${CONFIG_FILE}

test-clean: db-all-restart sleeper
test-all: test-qb test-qb-migrations test-clean test-cli-migrations

test-qb:
	deno test tests/query-builder
test-qb-migrations:
	deno test --allow-write --allow-run --allow-read tests/query-builder-migrations
test-cli-migrations: #db-pg-stop db-pg-start sleeper
	deno test --allow-write --allow-run --allow-read tests/cli
sleeper:
	sleep 30s

db-all-restart: db-all-stop db-all-start
db-all-start: db-pg-start db-mysql-start db-sqlite-start
db-all-stop: db-pg-stop db-mysql-stop db-sqlite-stop
db-pg-start:
	docker run -d -p $(DB_PG_PORT):5432 -e POSTGRES_USER=$(DB_USER) -e POSTGRES_PASSWORD=$(DB_PWD) -e POSTGRES_DB=${DB_NAME} -v `pwd`/tests/data/pg:/var/lib/postgresql/data --rm --name $(DB_NAME)-pg postgres:latest
db-pg-stop:
	docker kill ${DB_NAME}-pg | true
	rm -rf tests/data/pg
db-mysql-start:
	# docker run -d -p $(DB_MYSQL_PORT):3306 -e MYSQL_ROOT_PASSWORD=$(DB_PWD) -e MYSQL_DATABASE=${DB_NAME} -v `pwd`/tests/data/mysql:/var/lib/mysql --rm --name $(DB_NAME)-mysql mysql:5
	docker run -d -p $(DB_MYSQL_PORT):3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=true -e MYSQL_DATABASE=${DB_NAME} -v `pwd`/tests/data/mysql:/var/lib/mysql --rm --name $(DB_NAME)-mysql mysql:latest
db-mysql-stop:
	docker kill ${DB_NAME}-mysql | true
	rm -rf tests/data/mysql
db-sqlite-start:
	mkdir -p tests/data && touch tests/data/sqlite.db
db-sqlite-stop:
	rm -rf tests/data/sqlite.db
