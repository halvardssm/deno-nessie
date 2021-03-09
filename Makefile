DB_PG_PORT=5000
DB_MYSQL_PORT=5001
DB_USER=root
DB_PWD=pwd
DB_NAME=nessie

test-all: db-all-restart test-cli-migrations db-all-restart test-cli-migrations-experimental test-cli-update-timestamps

test-cli-migrations:
	deno test --allow-write --allow-run --allow-read --unstable tests/cli
test-cli-migrations-experimental:
	deno test --allow-write --allow-run --allow-read --unstable tests/cli-experimental
test-cli-update-timestamps:
	deno test --allow-write --allow-run --allow-read --unstable tests/update_timestamps

db-all-restart: db-all-stop db-all-start
db-all-start: db-pg-start db-mysql-start db-sqlite-start
db-all-stop: db-pg-stop db-mysql-stop db-sqlite-stop
db-pg-start:
	docker run -d --rm \
	-p $(DB_PG_PORT):5432 \
	-e POSTGRES_USER=$(DB_USER) \
	-e POSTGRES_PASSWORD=$(DB_PWD) \
	-e POSTGRES_DB=${DB_NAME} \
	-v `pwd`/tests/data/pg:/var/lib/postgresql/data \
	--name $(DB_NAME)-pg \
	--health-cmd pg_isready \
	--health-interval 10s \
	--health-timeout 5s \
	--health-retries 5 \
	postgres:latest
	while [ "`docker inspect -f {{.State.Health.Status}} $(DB_NAME)-pg`" != "healthy" ]; do sleep 10; done
	sleep 5
db-pg-stop:
	docker kill ${DB_NAME}-pg | true
	rm -rf tests/data/pg
db-mysql-start:
	# docker run -d -p $(DB_MYSQL_PORT):3306 -e MYSQL_ROOT_PASSWORD=$(DB_PWD) -e MYSQL_DATABASE=${DB_NAME} -v `pwd`/tests/data/mysql:/var/lib/mysql --rm --name $(DB_NAME)-mysql mysql:5
	docker run -d --rm \
	-p $(DB_MYSQL_PORT):3306 \
	-e MYSQL_ALLOW_EMPTY_PASSWORD=true \
	-e MYSQL_DATABASE=${DB_NAME} \
	-v `pwd`/tests/data/mysql:/var/lib/mysql \
	--name $(DB_NAME)-mysql \
	--health-cmd "mysqladmin ping" \
	--health-interval 10s \
	--health-timeout 5s \
	--health-retries 5 \
	mysql:latest
	while [ "`docker inspect -f {{.State.Health.Status}} $(DB_NAME)-mysql`" != "healthy" ]; do sleep 10; done
	sleep 5
db-mysql-stop:
	docker kill ${DB_NAME}-mysql | true
	rm -rf tests/data/mysql
db-sqlite-start:
	mkdir -p tests/data && touch tests/data/sqlite.db
db-sqlite-stop:
	rm -rf tests/data/sqlite.db

bump-%: # version number and deno version separated by `:` e.g. 1.2.3:1.2.3
	deno run --allow-read --allow-write prepare_release.ts $*
