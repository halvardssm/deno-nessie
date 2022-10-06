import { REG_EXP_VERSION, REG_EXP_VERSION_STABLE } from "./commons.ts";

const REG_EXP_README_DENO_VERSION = /shields\.io\/badge\/deno-v\d+\.\d+\.\d+/;
const REG_EXP_MAKEFILE_DENO_VERSION = /DENO_VERSION=\d+\.\d+\.\d+/;
const REG_EXP_CI_DENO_VERSION = /DENO_VERSION: \d+\.\d+\.\d+/;
const REG_EXP_MAKEFILE_NESSIE_VERSION = /NESSIE_VERSION=\d+\.\d+\.\d+(-rc\d+)?/;
const REG_EXP_PROGRAM_NESSIE_VERSION =
  /export const VERSION = \"\d+\.\d+\.\d+(-rc\d+)?\";/;
const FILE_JSON_EGG = "egg.json";
const FILE_README = "README.md";
const FILE_PROGRAM = "consts.ts";
const FILE_MAKEFILE = "Makefile";
const FILES_CI = [
  ".github/workflows/ci.yml",
  ".github/workflows/publish_nest.yml",
  ".github/workflows/publish_docker.yml",
];

type VERSIONS = {
  nessie: string | undefined;
  deno: string | undefined;
};

const setEggConfig = async (versions: VERSIONS) => {
  if (versions.nessie) {
    // deno-lint-ignore no-explicit-any
    const eggFile = JSON.parse(await Deno.readTextFile(FILE_JSON_EGG)) as any;

    eggFile.version = versions.nessie;
    eggFile.stable = REG_EXP_VERSION_STABLE.test(versions.nessie);

    await Deno.writeTextFile(
      FILE_JSON_EGG,
      JSON.stringify(eggFile, undefined, 2),
    );

    console.info(`egg.json updated to ${versions.nessie}`);
  }
};

const setReadMe = async (versions: VERSIONS) => {
  if (versions.deno) {
    const readme = await Deno.readTextFile(FILE_README);

    const res = readme.replace(
      REG_EXP_README_DENO_VERSION,
      `shields.io/badge/deno-v${versions.deno}`,
    );

    await Deno.writeTextFile(FILE_README, res);

    console.info(`README.md updated to ${versions.deno}`);
  }
};

const setProgram = async (versions: VERSIONS) => {
  if (versions.nessie) {
    const cli = await Deno.readTextFile(FILE_PROGRAM);

    const res = cli.replace(
      REG_EXP_PROGRAM_NESSIE_VERSION,
      `export const VERSION = "${versions.nessie}";`,
    );

    await Deno.writeTextFile(FILE_PROGRAM, res);

    console.info(`consts.ts updated to ${versions.nessie}`);
  }
};

const setCI = async (versions: VERSIONS) => {
  if (versions.deno || versions.nessie) {
    for (const file of FILES_CI) {
      let res = await Deno.readTextFile(file);

      if (versions.deno) {
        res = res.replace(
          REG_EXP_CI_DENO_VERSION,
          `DENO_VERSION: ${versions.deno}`,
        );
      }

      await Deno.writeTextFile(file, res);

      console.info(
        `${file} updated to Deno: ${versions.deno}`,
      );
    }
  }
};

const setMakefile = async (versions: VERSIONS) => {
  if (versions.deno || versions.nessie) {
    let res = await Deno.readTextFile(FILE_MAKEFILE);

    if (versions.nessie) {
      res = res.replace(
        REG_EXP_MAKEFILE_NESSIE_VERSION,
        `NESSIE_VERSION=${versions.nessie}`,
      );
    }

    if (versions.deno) {
      res = res.replace(
        REG_EXP_MAKEFILE_DENO_VERSION,
        `DENO_VERSION=${versions.deno}`,
      );
    }

    await Deno.writeTextFile(FILE_MAKEFILE, res);

    console.info(
      `${FILE_MAKEFILE} updated to Nessie: ${versions.nessie} and Deno: ${versions.deno}`,
    );
  }
};

async function runProgram() {
  const versionsRaw = Deno.args[0];

  // versions should be separated by `:` e.g. `[nessieVersion]:[denoVersion]`
  // and will not allow any other form than `1.2.3` or `` on the right side
  // and `1.2.3`, `1.2.3-rf4` or `` on the left side.
  // If this is not fulfilled, the version will not upgrade
  if (!versionsRaw.includes(":")) {
    console.info("separator not included");
    Deno.exit(1);
  }

  const versions = {
    nessie: REG_EXP_VERSION.test(versionsRaw.split(":")[0])
      ? versionsRaw.split(":")[0]
      : undefined,
    deno: REG_EXP_VERSION_STABLE.test(versionsRaw.split(":")[1])
      ? versionsRaw.split(":")[1]
      : undefined,
  };

  await setEggConfig(versions);
  await setProgram(versions);
  await setReadMe(versions);
  await setCI(versions);
  await setMakefile(versions);
}

await runProgram();
