import { MAX_FILE_NAME_LENGTH, REGEXP_MIGRATION_FILE_NAME } from "../consts.ts";
import type { LoggerFn } from "../types.ts";

/**
 * Whether the path is a `file:`, `http:` or `https:` URL, and not a file path.
 *
 * @param path a file path or a URL
 *
 * @example
 * ```ts
 * import { isUrl } from "@halvardm/nessie";
 * import { assert } from "@std/assert";
 *
 * assert(isUrl("https://example.com/migration.ts"));
 * assert(isUrl("file:///project/migration.ts"));
 * assert(!isUrl("./db/migrations/migration.ts"));
 * ```
 */
export function isUrl(path: string): boolean {
  return isRemoteUrl(path) || isFileUrl(path);
}

/**
 * Whether the path is a `file:` URL.
 *
 * @param path a file path or a URL
 */
export function isFileUrl(path: string): boolean {
  return path.startsWith("file://");
}

/**
 * Whether the path is a `http:` or `https:` URL.
 *
 * @param path a file path or a URL
 */
export function isRemoteUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

/**
 * Creates the logger for debug output.
 *
 * @param debug whether to print. Defaults to `false`, which gives a logger
 * which does nothing.
 * @returns a function which prints a value, after an optional title
 */
export function getLogger(debug = false): LoggerFn {
  if (!debug) return () => undefined;
  return (output, title) => {
    if (title) console.log(`${title}: `);
    console.log(output);
  };
}

/**
 * Whether the array has no duplicates.
 *
 * @param array the values to check
 */
export function arrayIsUnique(array: unknown[]): boolean {
  return array.length === new Set(array).size;
}

/**
 * Whether the name is a valid migration file name: `<yyyyMMddHHmmss>_<name>.ts`
 * where the name is lower snake case with digits, shorter than
 * {@linkcode MAX_FILE_NAME_LENGTH}.
 *
 * @param name the file name, without a folder
 *
 * @example
 * ```ts
 * import { isMigrationFile } from "@halvardm/nessie";
 * import { assert } from "@std/assert";
 *
 * assert(isMigrationFile("20240101120000_create_users.ts"));
 * assert(!isMigrationFile("create_users.ts")); // no timestamp
 * assert(!isMigrationFile("20240101120000_Create_Users.ts")); // not lower case
 * ```
 */
export function isMigrationFile(name: string): boolean {
  return REGEXP_MIGRATION_FILE_NAME.test(name) &&
    name.length < MAX_FILE_NAME_LENGTH;
}

/**
 * The time between two points in time, in seconds.
 *
 * @param startTime when it started, from `performance.now()`
 * @param endTime when it ended. Defaults to now.
 * @returns the seconds with two decimals, e.g. `"1.50"`
 */
export function getDurationFromTimestamp(
  startTime: number,
  endTime: number = performance.now(),
): string {
  return ((endTime - startTime) / 1000).toFixed(2);
}
