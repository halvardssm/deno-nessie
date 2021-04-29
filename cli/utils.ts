import { resolve } from "../deps.ts";

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
  return path.startsWith("http://") 
      || path.startsWith("https://") 
      || path.startsWith("file://")
};
