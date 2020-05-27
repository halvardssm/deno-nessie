import { resolve } from "../deps.ts";
import { State } from "./state.ts";

export const parsePath = (...path: string[]): string => {
  if (
    path.length === 1 &&
    (path[0]?.startsWith("http://") || path[0]?.startsWith("https://"))
  ) {
    return path[0];
  }
  return "file://" + resolve(...path);
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
