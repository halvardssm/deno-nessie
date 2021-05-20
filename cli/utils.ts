import { resolve } from "../deps.ts";
import {
  MAX_FILE_NAME_LENGTH,
  REGEX_FILE_NAME,
  REGEX_MIGRATION_FILE_NAME,
  REGEX_MIGRATION_FILE_NAME_LEGACY,
} from "../consts.ts";

/** Helper function for path parsing.
 *
 * If the first element starts with `http` or `https` or `file` it will return the first element.
 * Else, the path will be prefixed by `file://` and resolved.
 */
export const parsePath = (...path: string[]): string => {
  if (path.length === 1 && isUrl(path[0])) {
    return path[0];
  }

  return "file://" + resolve(...path);
};

export const isUrl = (path: string) => {
  return path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("file://");
};

export const isValidMigrationName = (
  name: string,
  isFilename = false,
  isLegacy = false,
): boolean => {
  if (name.length < 1) return false;

  if (isLegacy) {
    return REGEX_MIGRATION_FILE_NAME_LEGACY.test(name);
  }

  if (isFilename) {
    return REGEX_MIGRATION_FILE_NAME.test(name) &&
      name.length < MAX_FILE_NAME_LENGTH;
  }

  return REGEX_FILE_NAME.test(name) || name.length >= 80;
};
