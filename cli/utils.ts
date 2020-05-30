import { resolve } from "../deps.ts";

export const parsePath = (...path: string[]): string => {
  if (
    path.length === 1 &&
    (path[0]?.startsWith("http://") || path[0]?.startsWith("https://"))
  ) {
    return path[0];
  }
  return "file://" + resolve(...path);
};
