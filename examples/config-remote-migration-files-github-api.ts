import {
  isMigrationFile,
  NessieConfig,
  SqLiteMigrationClient,
} from "../mod.ts";

/**
 * This example uses the github api to get the the folder content of a repository.
 * See https://docs.github.com/en/rest/reference/repos#get-repository-content for documentation.
 */

type ResponseFormat = {
  download_url: string;
  name: string;
};

const res = await fetch(
  "https://api.github.com/repos/halvardssm/deno-nessie/contents/examples",
  { headers: { "Authorization": `token some-token` } },
);

// Here we arrume that the url is to a directory and that we get an array back
const body = await res.json() as ResponseFormat[];

//We only want migration files
const migrationFiles = body.filter((el) => isMigrationFile(el.name))
  // We are only interested in the raw url of the file
  .map((el) => el.download_url);

const config: NessieConfig = {
  client: new SqLiteMigrationClient({ client: ["sqlite.db"] }),
  additionalMigrationFiles: migrationFiles,
};

export default config;
