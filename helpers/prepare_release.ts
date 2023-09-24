import { format, SemVer } from "https://deno.land/std@0.202.0/semver/mod.ts";
import { tryParse } from "https://deno.land/std@0.202.0/semver/try_parse.ts";

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

type Versions = {
  nessie: SemVer | undefined;
  deno: SemVer | undefined;
};

const setEggConfig = async (versions: Versions) => {
  if (versions.nessie) {
    // deno-lint-ignore no-explicit-any
    const eggFile = JSON.parse(await Deno.readTextFile(FILE_JSON_EGG)) as any;

    eggFile.version = format(versions.nessie);
    eggFile.stable = !versions.nessie.prerelease.length;

    await Deno.writeTextFile(
      FILE_JSON_EGG,
      JSON.stringify(eggFile, undefined, 2),
    );

    console.info(`egg.json updated to ${eggFile.version}`);
  }
};

const setReadMe = async (versions: Versions) => {
  if (versions.deno) {
    const readme = await Deno.readTextFile(FILE_README);

    const res = readme.replace(
      REG_EXP_README_DENO_VERSION,
      `shields.io/badge/deno-v${format(versions.deno)}`,
    );

    await Deno.writeTextFile(FILE_README, res);

    console.info(`README.md updated to ${format(versions.deno)}`);
  }
};

const setProgram = async (versions: Versions) => {
  if (versions.nessie) {
    const cli = await Deno.readTextFile(FILE_PROGRAM);

    const res = cli.replace(
      REG_EXP_PROGRAM_NESSIE_VERSION,
      `export const VERSION = "${format(versions.nessie)}";`,
    );

    await Deno.writeTextFile(FILE_PROGRAM, res);

    console.info(`consts.ts updated to ${format(versions.nessie)}`);
  }
};

const setCI = async (versions: Versions) => {
  if (versions.deno || versions.nessie) {
    for (const file of FILES_CI) {
      let res = await Deno.readTextFile(file);

      if (versions.deno) {
        res = res.replace(
          REG_EXP_CI_DENO_VERSION,
          `DENO_VERSION: ${format(versions.deno)}`,
        );

        console.info(
          `${file} updated to Deno: ${format(versions.deno)}`,
        );
      }

      await Deno.writeTextFile(file, res);
    }
  }
};

const setMakefile = async (versions: Versions) => {
  if (versions.deno || versions.nessie) {
    let res = await Deno.readTextFile(FILE_MAKEFILE);

    if (versions.nessie) {
      res = res.replace(
        REG_EXP_MAKEFILE_NESSIE_VERSION,
        `NESSIE_VERSION=${format(versions.nessie)}`,
      );
    }

    if (versions.deno) {
      res = res.replace(
        REG_EXP_MAKEFILE_DENO_VERSION,
        `DENO_VERSION=${format(versions.deno)}`,
      );
    }

    await Deno.writeTextFile(FILE_MAKEFILE, res);

    console.info(
      `${FILE_MAKEFILE} updated to Nessie: ${
        versions.nessie && format(versions.nessie)
      } and Deno: ${versions.deno && format(versions.deno)}`,
    );
  }
};

async function runProgram() {
  const versionsRaw = Deno.env.get("NESSIE_BUMP_VERSION");

  // versions should be separated by `:` e.g. `[nessieVersion]:[denoVersion]`
  // and will not allow any other form than `1.2.3` or `` on the right side
  // and `1.2.3`, `1.2.3-rf4` or `` on the left side.
  // If this is not fulfilled, the version will not upgrade
  if (!versionsRaw || !versionsRaw.includes(":")) {
    console.error(
      "Separator not included. Must use format [nessieVersion]:[denoVersion]. E.g. NESSIE_BUMP_VERSION=1.2.3:1.2.3",
    );
    Deno.exit(1);
  }

  const versions = {
    nessie: tryParse(versionsRaw.split(":")[0]),
    deno: tryParse(versionsRaw.split(":")[1]),
  };

  await setEggConfig(versions);
  await setProgram(versions);
  await setReadMe(versions);
  await setCI(versions);
  await setMakefile(versions);
}

await runProgram();
