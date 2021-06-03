ARG DENO_VERSION=latest

FROM denoland/deno:${DENO_VERSION}

WORKDIR /opt/lib/nessie
COPY . .

RUN deno install -A --unstable --name nessie cli.ts
RUN deno cache --unstable mod.ts

WORKDIR /nessie

VOLUME ["/nessie"]

ENTRYPOINT [ "nessie" ]
