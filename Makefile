DB_PG_PORT=5000
DB_MYSQL_PORT=5001
DB_USER=root
DB_PWD=pwd
DB_NAME=nessie
NESSIE_VERSION=2.0.4
DENO_VERSION=1.15.3
DOCKER_IMAGE=halvardm/nessie

test_all: test_fmt test_unit db_all_restart test_integration_cli db_all_restart test_integration_update_timestamps image_build image_test_clean image_test image_test_clean
test: test_all

test_fmt:
	deno lint --unstable --ignore=tests,examples,cli/templates
	deno fmt --check --ignore=coverage

test_unit:
	deno test -A --unstable --coverage=coverage tests/unit
test_integration_cli:
	deno test -A --unstable --coverage=coverage tests/integration/cli
test_integration_update_timestamps:
	deno test -A --unstable --coverage=coverage tests/integration/update_timestamps

db_all_restart: db_all_stop db_all_start
db_all_start: db_pg_start db_mysql_start db_sqlite_start
db_all_stop: db_pg_stop db_mysql_stop db_sqlite_stop
db_pg_start:
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
db_pg_stop:
	docker kill ${DB_NAME}-pg | true
	rm -rf tests/data/pg
db_mysql_start:
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
db_mysql_stop:
	docker kill ${DB_NAME}-mysql | true
	rm -rf tests/data/mysql
db_sqlite_start:
	mkdir -p tests/data && touch tests/data/sqlite.db
db_sqlite_stop:
	rm -rf tests/data/sqlite.db

image_build:
	docker build --pull --build-arg DENO_VERSION=$(DENO_VERSION) -f ./image/Dockerfile -t $(DOCKER_IMAGE):latest -t $(DOCKER_IMAGE):$(NESSIE_VERSION) .
image_push:
	docker push -a $(DOCKER_IMAGE)
image_test:
	docker run --rm -v `pwd`/tests/image:/nessie $(DOCKER_IMAGE) init --dialect sqlite
	docker run --rm -v `pwd`/tests/image:/nessie $(DOCKER_IMAGE) make test
	docker run --rm -v `pwd`/tests/image:/nessie $(DOCKER_IMAGE) migrate
image_test_clean:
	rm -rf tests/image/*
image_run:
	docker run --rm -v `pwd`/tests/image:/nessie $(DOCKER_IMAGE) help

bump_%: # version number and deno version separated by `:` e.g. 1.2.3:1.2.3
	deno run --allow-read --allow-write helpers/prepare_release.ts $*
	deno fmt --ignore=coverage
