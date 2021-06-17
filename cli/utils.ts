import { MAX_FILE_NAME_LENGTH, REGEXP_MIGRATION_FILE_NAME } from "../consts.ts";
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

/**
 * Helper method to validate if a filename is a valid migration filename.
 * Checks both the filename syntax and length.
 */
export function isMigrationFile(name: string): boolean {
  return REGEXP_MIGRATION_FILE_NAME.test(name) &&
    name.length < MAX_FILE_NAME_LENGTH;
}

/** Returns duration in milliseconds */
export async function getDurationForFunction<T>(
  fn: () => Promise<T>,
): Promise<[number, T]> {
  const t1 = performance.now();

  const res = await fn();

  const t2 = performance.now() - t1;

  return [t2, res];
}

export function getDurationFromTimestamp(
  startTime: number,
  endTime?: number,
): string {
  return (((endTime ?? performance.now()) - startTime) / 1000).toFixed(2);
}
