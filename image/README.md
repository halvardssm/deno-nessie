# Nessie Docker Image

This is the official Docker image for Nessie -  a modular database migration tool for Deno.

[Repo](https://github.com/halvardssm/deno-nessie/)

To use the Nessie Docker image, you can either extend it as you normally would
and place the config file and migration files in `/nessie`. The default work
directory is `/nessie` and cmd is set to the `nessie` cli.

> Always use a fixed version for production software to reduce unexpected bugs,
> and always backup your database before upgrading the nessie version.

## General Usage

### Extend dockerfile

```Dockerfile
FROM halvardm/nessie:latest

# Uncomment this line if your migrations and config file is dependend on a deps.ts file and copy in other dependencies
# COPY deps.ts .

COPY db .
COPY nessie.config.ts .
```

Build the dockerfile and run it as such:

```shell
docker build -t migrations .
docker run -it migrations
```

### Local development

```shell
docker run -v `pwd`:/nessie halvardm/nessie init --dialect sqlite
docker run -v `pwd`:/nessie halvardm/nessie make new_migration
docker run -v `pwd`:/nessie halvardm/nessie migrate
docker run -v `pwd`:/nessie halvardm/nessie rollback
```

If you have a database running in docker, you will have to set up a docker
network and connect it to the database container.

```shell
docker run -v `pwd`:/nessie --network db halvardm/nessie migrate
```
