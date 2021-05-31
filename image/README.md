# Nessie Docker Image

This is the official Docker image for Nessie - a modular database migration tool
for Deno.

https://github.com/halvardssm/deno-nessie/

To use the Nessie Docker image, you can either extend it as you normally would
and place the config file and migration files in `/nessie`. The default work
directory is `/nessie` and cmd is set to the `nessie` cli.

> Always use a fixed version for production software to reduce unexpected bugs,
> and always backup your database before upgrading the nessie version.

## Tags

In adition to the versioned tags, which are in sync with the Nessie version, we have `latest` and `next` which are always up to date. `latest` will give you the latest stable release, while `next` will either be the latest release candidate (unstable version), or equivalent to `latest` if there are no release candidates. Release candidates mostly occurs only for major releases. As a rule of thumb, you should only use a versioned image for production.

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
