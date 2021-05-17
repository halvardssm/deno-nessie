import { MAX_FILE_NAME_LENGTH, REGEX_MIGRATION_FILE_NAME } from "../consts.ts";
import { LoggerFn } from "../types.ts";

export const isUrl = (path: string) => {
  return isRemoteUrl(path) || isFileUrl(path);
};

export const isFileUrl = (path: string) => {
  return path.startsWith("file://");
};

export const isRemoteUrl = (path: string) => {
  return path.startsWith("http://") ||
    path.startsWith("https://");
};

/** A logger to use throughout the application, outputs when the debugger is enabled */
export function getLogger(): LoggerFn {
  // deno-lint-ignore no-explicit-any
  return (output?: any, title?: string) => {
    try {
      title ? console.log(title + ": ") : null;
      console.log(output);
    } catch {
      console.error("Error at: " + title);
    }
  };
}

/** Checks if an array only contains unique values */
export function arrayIsUnique(array: unknown[]): boolean {
  return array.length === new Set(array).size;
}

export function isMigrationFile(name: string): boolean {
  return REGEX_MIGRATION_FILE_NAME.test(name) &&
    name.length < MAX_FILE_NAME_LENGTH;
}
