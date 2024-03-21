import { bold, yellow } from "@std/fmt/colors";
import configFile from "../deno.json" with { type: "json" };

export const VERSION = configFile.version;
export const MODULE_NAME = configFile.name;
export const MODULE_JSR_IMPORT: string = `jsr:${MODULE_NAME}`;

export const SPONSOR_NOTICE: string = bold(
  yellow(
    "If you are using Nessie commercially, please consider supporting future development.\nGive a donation here: https://github.com/halvardssm/deno-nessie",
  ),
);

export const DEFAULT_CONFIG_FILE = "nessie.config.ts";
export const DEFAULT_MIGRATION_FOLDER = "./db/migrations";
export const DEFAULT_SEED_FOLDER = "./db/seeds";

export const MAX_FILE_NAME_LENGTH = 100;
/** RegExp to validate the file name */
export const REGEXP_MIGRATION_FILE_NAME = /^\d{14}_[a-z\d]+(_[a-z\d]+)*.ts$/;
export const REGEXP_FILE_NAME = /^[a-z\d]+(_[a-z\d]+)*$/;
