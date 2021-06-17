import * as semver from "https://deno.land/x/semver@v1.4.0/mod.ts";
import { REG_EXP_VERSION_NEXT, REG_EXP_VERSION_STABLE } from "./commons.ts";

async function getTags() {
  const decoder = new TextDecoder();
  const processTags = Deno.run({
    cmd: [
      "git",
      "tag",
      "--sort",
      "-version:refname",
      "--merged",
      "main",
    ],
    stdout: "piped",
  });

  const { code } = await processTags.status();
  const rawOutput = await processTags.output();

  const result = decoder.decode(rawOutput);

  if (code !== 0) {
    console.error(result);
    Deno.exit(code);
  }

  processTags.close();

  return result.split("\n").filter((tag) => !tag.startsWith("v"));
}

async function getCurrentTag() {
  const decoder = new TextDecoder();
  const processTags = Deno.run({
    cmd: [
      "git",
      "describe",
      "--tags",
      "--abbrev=0",
    ],
    stdout: "piped",
  });

  const { code } = await processTags.status();
  const rawOutput = await processTags.output();

  const result = decoder.decode(rawOutput);

  if (code !== 0) {
    console.error(result);
    Deno.exit(code);
  }

  processTags.close();

  return result;
}

async function generateTagsArray() {
  const IMAGE = "halvardm/nessie";

  const tags = await getTags();
  const current = await getCurrentTag();

  const latestStable =
    tags.filter((tag) => REG_EXP_VERSION_STABLE.test(tag))[0];
  const latestNext = tags.filter((tag) => REG_EXP_VERSION_NEXT.test(tag))[0];

  const outputArray = [`${IMAGE}:${current}`];

  if (
    REG_EXP_VERSION_STABLE.test(current) && semver.gte(current, latestStable)
  ) {
    outputArray.push(`${IMAGE}:latest`);
  }

  if (semver.gte(current, latestNext)) {
    outputArray.push(`${IMAGE}:next`);
  }

  const result = outputArray.join(",");

  const encoder = new TextEncoder();

  await Deno.stdout.write(encoder.encode(result));
}

await generateTagsArray();

Deno.exit(0);
