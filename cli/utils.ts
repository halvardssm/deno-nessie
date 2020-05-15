import { MySQLClient, PGClient, resolve, SQLiteClient } from "../deps.ts";
import Schema from "../src/Schema.ts";
import { State } from "./state.ts";

export const TABLE_MIGRATIONS = "nessie_migrations";
export const COL_FILE_NAME = "file_name";
export const COL_CREATED_AT = "created_at";

export const REGEX_MIGRATION_FILE_NAME = /^\d{10,14}-.+.ts$/;
let regexFileName = new RegExp(REGEX_MIGRATION_FILE_NAME);

export const QUERY_GET_LATEST =
  `select ${COL_FILE_NAME} from ${TABLE_MIGRATIONS} order by ${COL_CREATED_AT} desc limit 1`;
export const QUERY_INSERT = (fileName: string) =>
  `INSERT INTO ${TABLE_MIGRATIONS} (${COL_FILE_NAME}) VALUES ('${fileName}');`;
export const QUERY_DELETE = (fileName: string) =>
  `DELETE FROM ${TABLE_MIGRATIONS} WHERE ${COL_FILE_NAME} = '${fileName}';`;

export interface ClientI {
  rollback: () => void;
  migrate: () => void;
  close: () => void;
}

export type ClientTypes = {
  pg?: PGClient;
  mysql?: MySQLClient;
  sqlite?: SQLiteClient;
};

export const parsePath = (...path: string[]): string => {
  if (
    path.length === 1 &&
    (path[0]?.startsWith("http://") || path[0]?.startsWith("https://"))
  ) {
    return path[0];
  }
  return "file://" + resolve(...path);
};

export const filterAndSortFiles = (
  files: Deno.DirEntry[],
  queryResult: string | undefined,
): Deno.DirEntry[] => {
  return files.filter((file: Deno.DirEntry): boolean => {
    if (!regexFileName.test(file.name)) return false;

    if (queryResult === undefined) return true;

    return parseInt(file.name.split("-")[0]) >
      new Date(queryResult).getTime();
  })
    .sort((a, b) => parseInt(b?.name ?? "0") - parseInt(a?.name ?? "0"));
};

export const traverseAndMigrateFiles = async (
  state: State,
  files: Deno.DirEntry[],
  queryfn: (query: string) => any,
) => {
  if (files.length > 0) {
    for await (const file of files) {
      let { up } = await import(parsePath(state.migrationFolder, file.name));

      const schema = new Schema(state.dialect);

      await up(schema);

      let query = schema.query;

      query += QUERY_INSERT(file.name);

      state.debug(query, "Migration query");

      const result = await queryHandler(
        query,
        state,
        async (query) => await queryfn(query),
      );

      console.info(`Migrated ${file.name}`);

      state.debug(result, "Migrations");
    }

    console.info("Migration complete");
  } else {
    console.info("Nothing to migrate");
  }
};

export const traverseAndRollbackFiles = async (
  state: State,
  fileName: string | undefined,
  queryfn: (query: string) => any,
) => {
  if (typeof fileName === "string") {
    let { down } = await import(parsePath(state.migrationFolder, fileName));

    const schema = new Schema(state.dialect);

    await down(schema);

    let query = schema.query;

    state.debug(query, "Rollback query");

    query += QUERY_DELETE(fileName);

    await queryfn(query);

    console.info(`Rolled back ${fileName}`);
  } else {
    console.info("Nothing to rollback");
  }
};

export const queryHandler = async (
  queryString: string,
  state: State,
  queryfn: (query: string) => any,
) => {
  const queries = queryString.trim().split(/(?<!\\);/);

  if (queries[queries.length - 1]?.trim() === "") queries.pop();

  state.debug(queries, "Queries");

  const results = [];

  for (let query of queries) {
    query = query.trim().replace("\\;", ";");
    state.debug(query, "Query");

    const result = await queryfn(query + ";");

    results.push(result);
  }

  state.debug(results, "Query result");

  return results;
};
