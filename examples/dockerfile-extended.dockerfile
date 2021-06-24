FROM halvardm/nessie:latest

# Uncomment this line if you migrations and config file is dependend on a deps.ts file
# COPY deps.ts .

COPY db .
COPY nessie.config.ts .
