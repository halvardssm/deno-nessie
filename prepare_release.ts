import { readJson } from "https://deno.land/std/fs/read_json.ts";
import { writeJson } from "https://deno.land/std/fs/write_json.ts";

const REG_EXP_VERSION = /^\d+.\d+.\d+$/;
const REG_EXP_README_VERSION = /shields\.io\/badge\/deno-v\d+.\d+.\d+/;
const REG_EXP_CLI_VERSION = /app_version: \"\d+.\d+.\d\"/;
const REG_EXP_CI = /DENO_VERSION: \d+.\d+.\d/;
const FILE_JSON_EGG = "egg.json";
const FILE_README = "README.md";
const FILE_CLI = "cli.ts";
const FILES_CI = [
  ".github/workflows/ci.yml",
  ".github/workflows/publish_nest.yml",
];

const versions = Deno.args[0];

// versions should be separated by `:` e.g. `[nessieVersion]:[denoVersion]`
// and will not allow any other form than `1.2.3` on either side.
// If this is not fulfilled, the version will not upgrade
if (!versions.includes(":")) {
  console.info("separator not included");
  Deno.exit(1);
}

let versionNessie: string | undefined = versions.split(":")[0];
let versionDeno: string | undefined = versions.split(":")[1];

if (!REG_EXP_VERSION.test(versionNessie)) {
  versionNessie = undefined;
}

if (!REG_EXP_VERSION.test(versionDeno)) {
  versionDeno = undefined;
}

const setEggConfig = async (version: string) => {
  const eggFile = await readJson(FILE_JSON_EGG) as any;

  eggFile.version = version;

  await writeJson(FILE_JSON_EGG, eggFile, { spaces: 2 });

  console.info(`egg.json updated to ${version}`);
};

const setReadMe = async (version: string) => {
  let readme = await Deno.readTextFile(FILE_README);

  const res = readme.replace(
    REG_EXP_README_VERSION,
    `shields.io/badge/deno-v${version}`,
  );

  await Deno.writeTextFile(FILE_README, res);

  console.info(`README.md updated to ${version}`);
};

const setCli = async (version: string) => {
  const cli = await Deno.readTextFile(FILE_CLI);

  const res = cli.replace(REG_EXP_CLI_VERSION, `app_version: "${version}"`);

  await Deno.writeTextFile(FILE_CLI, res);

  console.info(`cli.ts updated to ${version}`);
};

const setCI = async (version: string) => {
  for (const file of FILES_CI) {
    const cli = await Deno.readTextFile(file);

    const res = cli.replace(REG_EXP_CI, `DENO_VERSION: ${version}`);

    await Deno.writeTextFile(file, res);

    console.info(`${file} updated to ${version}`);
  }
};

if (versionNessie) {
  await setEggConfig(versionNessie);
}

if (versionNessie) {
  await setCli(versionNessie);
}

if (versionDeno) {
  await setReadMe(versionDeno);
}

if (versionDeno) {
  await setCI(versionDeno);
}
