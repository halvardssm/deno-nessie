import { resolve, toFileUrl } from "@std/path";
import { MAX_FILE_NAME_LENGTH, REGEXP_MIGRATION_FILE_NAME } from "../consts.ts";
import type { FileEntry, LoggerFn } from "../types.ts";
import { NessieError } from "./errors.ts";

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

/** Options for {@linkcode listMigrationFiles} */
export interface ListMigrationFilesOptions {
  /**
   * Which file names to include, e.g. `(name) => name.endsWith(".ts")` for a
   * seed folder. Defaults to {@linkcode isMigrationFile}. File names which
   * are not accepted are skipped.
   */
  accept?: (name: string) => boolean;
  /**
   * What to do when the folder does not exist: `"error"` throws a
   * {@linkcode NessieError}, `"empty"` returns an empty list, which is
   * friendlier when the folder is optional. Defaults to `"error"`, so a
   * misconfigured folder is caught.
   */
  onMissingFolder?: "error" | "empty";
}

/**
 * The migration files in a local folder, sorted by name, which is the order
 * they run in. This is the same scanning the CLI does, for configuring a
 * {@linkcode MigrationClient} from code, without hand-rolling a `readDir`
 * loop.
 *
 * Each `path` is a `file:` URL, which `import()` and the checksum read
 * accept. Folders, and file names which are not valid migration names, are
 * skipped. Remote folders can not be scanned: give remote files explicit
 * {@linkcode FileEntry} entries.
 *
 * @param folder the folder to scan: a path relative to the working directory,
 * an absolute path, or a `file:` URL, as a string or a URL
 * @param options which file names to accept, and what to do when the folder
 * does not exist
 * @returns the files, sorted by name
 * @throws {NessieError} when the folder is remote, or does not exist and
 * {@linkcode ListMigrationFilesOptions.onMissingFolder} is not `"empty"`
 *
 * @example
 * ```ts
 * import { listMigrationFiles } from "@halvardm/nessie";
 * import { assert, assertEquals } from "@std/assert";
 *
 * const dir = await Deno.makeTempDir();
 * try {
 *   await Deno.writeTextFile(
 *     `${dir}/20240101120000_create_users.ts`,
 *     "export default { async up() {}, async down() {} };",
 *   );
 *   await Deno.writeTextFile(`${dir}/notes.txt`, ""); // not a migration name
 *
 *   const files = await listMigrationFiles(dir);
 *   assertEquals(files.map((file) => file.name), [
 *     "20240101120000_create_users.ts",
 *   ]);
 *   // The path is a file URL, which import() and the checksum read accept
 *   assert(files[0].path.startsWith("file://"));
 * } finally {
 *   await Deno.remove(dir, { recursive: true });
 * }
 * ```
 */
export async function listMigrationFiles(
  folder: string | URL,
  options: ListMigrationFilesOptions = {},
): Promise<FileEntry[]> {
  const { accept = isMigrationFile, onMissingFolder = "error" } = options;
  const href = typeof folder === "string" && !isUrl(folder)
    ? toFileUrl(resolve(Deno.cwd(), folder)).href
    : new URL(folder).href;

  if (isRemoteUrl(href)) {
    throw new NessieError(
      `The folder ${href} is remote and can not be scanned, give its files explicit entries`,
    );
  }

  // Entries resolve against the folder, which needs a trailing slash
  const base = new URL(href.endsWith("/") ? href : `${href}/`);
  const files: FileEntry[] = [];
  try {
    for await (const entry of Deno.readDir(base)) {
      if (entry.isFile && accept(entry.name)) {
        files.push({ name: entry.name, path: new URL(entry.name, base).href });
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      if (onMissingFolder === "empty") return [];
      throw new NessieError(`The folder ${href} does not exist`);
    }
    throw error;
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
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
