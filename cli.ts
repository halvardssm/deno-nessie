import Denomander from "https://deno.land/x/denomander/mod.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";

const program = new Denomander(
  {
    app_name: "Migrating Denosaurs",
    app_description:
      "A micro database migration tool for deno. Currently only support for PostgreSQL",
    app_version: "0.0.1",
  },
);

program.option("-p --path", "Path to migration folder")
  .command("make [migrationName]", "Creates a migration file with the name")
  .command("migrate", "Migrates one migration")
  .command("rollback", "Rolls back one migration");

program.parse(Deno.args);

const path: string = !program.path
  ? `${Deno.cwd()}/migrations`
  : program.path?.startsWith("/")
    ? program.path
    : program.path.startsWith("./")
      ? `${Deno.cwd()}/${program.path.substring(2)}`
      : `${Deno.cwd()}/${program.path}`;

if (program.make) {
  await Deno.mkdir(path, { recursive: true });

  await Deno.copyFile(
    "./src/templates/migration.ts",
    `${path}/${Date.now()}-${program.make}.ts`,
  );
}

if (program.migrate) {
  const files = Deno.readdirSync(path);

  files.sort((a, b) => parseInt(b?.name ?? "0") - parseInt(a?.name ?? "0"));

  if (files[0].name) {
    let { up } = await import(`${path}/${files[0].name}`);
    const query = up();

    const client = new Client({});

    client.connect();
    client.query(query);
    client.end();
  }
}

if (program.rollback) {
  const files = Deno.readdirSync(path);

  files.sort((a, b) => parseInt(b?.name ?? "0") - parseInt(a?.name ?? "0"));

  if (files[0].name) {
    let { down } = await import(`${path}/${files[0].name}`);
    const query = down();

    const client = new Client({});

    client.connect();
    client.query(query);
    client.end();
  }
}
