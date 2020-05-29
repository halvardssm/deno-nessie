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

export const safeConfigImport = async (
  file: string,
): Promise<any | undefined> => {
  try {
    const configRaw = await import(file);
    return configRaw.default;
  } catch (e) {
    return;
  }
};
