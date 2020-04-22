import Denomander from "https://deno.land/x/denomander/mod.ts";
import { Client as MySQLClient } from "https://deno.land/x/mysql/mod.ts";
import { Client as PGClient } from "https://deno.land/x/postgres/mod.ts";
import { QueryResult } from "https://deno.land/x/postgres/query.ts";
import { Schema } from "./mod.ts";
import { nessieConfigType, _nessieConfigType } from "./nessie.config.ts";
const TABLE_NAME_MIGRATIONS = "nessie_migrations";
const COL_FILE_NAME = "file_name";
const COL_CREATED_AT = "created_at";
type ClientTypes = PGClient | MySQLClient;
let Client: ClientTypes;

const program = new Denomander(
  {
    app_name: "Nessie Migrations",
    app_description:
      "A micro database migration tool for deno. Currently can only migrate to Postgres",
    app_version: "0.1.0",
  },
);

const outputDebug = (output: any, title?: string) => {
  if (program.debug) {
    title ? console.log(title + ": ") : null;
    console.log(output);
  }
};

program
  .option("-d --debug", "Enables verbose output")
  .option(
    "-c --config",
    "Path to config file, will default to ./nessie.config.json",
  )
  .command("make [migrationName]", "Creates a migration file with the name")
  .command("migrate", "Migrates one migration")
  .command("rollback", "Rolls back one migration");

program.parse(Deno.args);

const configHandler = async (): Promise<_nessieConfigType> => {
  let configContent: nessieConfigType;
  let result: _nessieConfigType;
  let configFile;

  try {
    configFile = await import(
      program.config || `${Deno.cwd()}/nessie.config.ts`
    );
  } catch (e) {
    configFile = await import("./nessie.config.ts");
  } finally {
    configContent = configFile.default;

    outputDebug(configContent, "Incoming config");

    result = {
      migrationFolder: "",
      connection: {
        ...configContent.connection,
        dialect: configContent.connection.dialect
          ? configContent.connection.dialect
          : "pg",
        port: `${configContent.connection.port}`,
      },
      args: configContent.args,
    };

    result.migrationFolder = !configContent.migrationFolder
      ? `${Deno.cwd()}/migrations`
      : configContent.migrationFolder?.startsWith("/")
        ? configContent.migrationFolder
        : configContent.migrationFolder.startsWith("./")
          ? `${Deno.cwd()}${configContent.migrationFolder.substring(1)}`
          : `${Deno.cwd()}/${configContent.migrationFolder}`;
  }

  return result;
};

let config = await configHandler();
outputDebug(config, "Parsed config");

outputDebug(config.migrationFolder, "Path");

const queryHandler = async (client: ClientTypes, query: string) => {
  const queries = query.trim().split(";");

  if (queries[queries.length - 1] === "") queries.pop();

  if (queries.length === 1) return await client.query(query);

  const results: QueryResult[] = [];

  for (const el of queries) {
    outputDebug(el, "Query");

    const result = await client.query(el + ";");

    results.push(result);
  }

  outputDebug(results, "Query result");

  return results;
};

const makeMigration = async () => {
  await Deno.mkdir(config.migrationFolder, { recursive: true });

  const fileName = `${Date.now()}-${program.make}.ts`;

  await Deno.copyFile(
    "./src/templates/migration.ts",
    `${config.migrationFolder}/${fileName}`,
  );

  console.info(`Created migration ${fileName} at ${config.migrationFolder}`);
};

const createMigrationTable = async (client: ClientTypes) => {
  const hasTableString = Schema.hasTable(TABLE_NAME_MIGRATIONS);

  const hasMigrationTable = await client.query(hasTableString);

  outputDebug(hasMigrationTable, "Has migration table");

  const migrationTableExists =
    hasMigrationTable.rows[0][0] !== TABLE_NAME_MIGRATIONS;

  outputDebug(migrationTableExists, "Migration table exsists");

  if (migrationTableExists) {
    const schema = new Schema();

    let sql = schema.create(TABLE_NAME_MIGRATIONS, (table) => {
      table.id();
      table.string("file_name", 100);
      table.timestamp(COL_CREATED_AT);

      table.unique("file_name");
    });

    sql +=
      "CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$BEGIN NEW.updated_at = NOW() RETURN NEW END $$ LANGUAGE plpgsql;";

    //TODO Add soft delete
    // sql += ` CREATE OR REPLACE FUNCTION soft_delete() RETURNS VOID AS $$
    // BEGIN
    // RAISE EXCEPTION 'only soft deletes allowed';
    // END;
    // CREATE OR REPLACE RULE prevent_account_deletion AS ON DELETE
    // TO account
    // DO INSTEAD SELECT enforce_soft_delete();`

    const result = await queryHandler(client, sql);

    console.info("Created migration table");

    outputDebug(result, "Migration table creation");
  }
};

const migrate = async (client: ClientTypes) => {
  const files = Array.from(Deno.readdirSync(config.migrationFolder));

  outputDebug(files, "Files in migration folder");

  await createMigrationTable(client);

  const result = await client.query(
    `select ${COL_FILE_NAME} from ${TABLE_NAME_MIGRATIONS} order by ${COL_CREATED_AT} desc limit 1`,
  );

  outputDebug(result, "Latest migration");

  files
    .filter((file: Deno.DirEntry): boolean => {
      if (result.rows[0] === undefined) return true;

      return parseInt(file.name.split("-")[0]) >
        new Date(result.rows[0][0]).getTime();
    })
    .sort((a, b) => parseInt(b?.name ?? "0") - parseInt(a?.name ?? "0"));

  outputDebug(files, "Files after filter and sort");

  if (files.length > 0) {
    for await (const file of files) {
      let { up } = await import(`${config.migrationFolder}/${file.name}`);

      const schema = new Schema();

      await up(schema);

      let query = schema.query;

      query +=
        `INSERT INTO ${TABLE_NAME_MIGRATIONS} (${COL_FILE_NAME}, ${COL_CREATED_AT}) VALUES ('${file.name}', now());`;

      outputDebug(query, "Migration query");

      const result = await queryHandler(client, query);

      console.info(`Migrated ${file.name}`);

      outputDebug(result, "Migration table creation");
    }

    console.info("Migration complete");
  } else {
    console.info("Nothing to migrate");
  }
};

const rollback = async (client: ClientTypes) => {
  const result = await client.query(
    `select ${COL_FILE_NAME} from ${TABLE_NAME_MIGRATIONS} order by ${COL_CREATED_AT} desc limit 1`,
  );

  outputDebug(result, "Latest migration");

  if (result.rows[0] === undefined || result.rows[0][0] === undefined) {
    console.info("Nothing to rollback");
  } else {
    const fileName = result.rows[0][0];
    let { down } = await import(`${config.migrationFolder}/${fileName}`);

    const schema = new Schema();

    await down(schema);

    let query = schema.query;

    outputDebug(query, "Rollback query");

    query +=
      ` DELETE FROM ${TABLE_NAME_MIGRATIONS} WHERE ${COL_FILE_NAME} = '${fileName}';`;

    await queryHandler(client, query);

    console.info(`Rolled back ${fileName}`);
  }
};

const initClient = async (): Promise<ClientTypes> => {
  if (config.connection.dialect === "mysql") {
    const client = await new MySQLClient().connect({
      hostname: config.connection.host,
      username: config.connection.user,
      db: config.connection.name,
      password: config.connection.password,
      port: parseInt(config.connection.port),
      ...config.args,
    });

    return client;
  } else {
    const client = new PGClient({
      user: config.connection.user,
      database: config.connection.name,
      host: config.connection.host,
      port: config.connection.port,
      password: config.connection.password,
      ...config.args,
    });
    await client.connect();

    return client;
  }
};

const endClient = async (client: ClientTypes): Promise<void> => {
  if (config.connection.dialect === "mysql") {
    await (client as MySQLClient).close();
  } else {
    await (client as PGClient).end();
  }
};

const run = async () => {
  try {
    if (program.make) {
      await makeMigration();
    } else {
      const client = await initClient();

      if (program.migrate) {
        await migrate(client);
      } else if (program.rollback) {
        await rollback(client);
      }

      await endClient(client);
    }
  } catch (e) {
    console.error(e);
  }
};

run();
