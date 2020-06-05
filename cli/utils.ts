import { resolve } from "../deps.ts";

/** Helper function for path parsing. 
 * 
 * If the first element starts with `http` or `https` it will return the first element. 
 * Else, the path will be prefixed by `file://` and resolved. 
 */
export const parsePath = (...path: string[]): string => {
  if (
    path.length === 1 &&
    (path[0]?.startsWith("http://") || path[0]?.startsWith("https://"))
  ) {
    return path[0];
  }
  return "file://" + resolve(...path);
};
