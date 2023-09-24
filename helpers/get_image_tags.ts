import * as semver from "https://deno.land/x/semver@v1.4.0/mod.ts";
import { REG_EXP_VERSION_NEXT, REG_EXP_VERSION_STABLE } from "./commons.ts";

async function getTags() {
  const decoder = new TextDecoder();
  const processTags = new Deno.Command("git", {
    args: [
      "tag",
      "--sort",
      "-version:refname",
    ],
    stdout: "piped",
  });

  const { success, code, stdout } = await processTags.output();

  const result = decoder.decode(stdout);

  if (!success) {
    console.error(result);
    Deno.exit(code);
  }

  return result.split("\n").filter((tag) => !tag.startsWith("v"));
}

async function getCurrentTag() {
  const decoder = new TextDecoder();
  const processTags = new Deno.Command("git", {
    args: [
      "describe",
      "--tags",
      "--abbrev=0",
    ],
    stdout: "piped",
  });

  const { code, success, stdout } = await processTags.output();

  const result = decoder.decode(stdout);

  if (!success) {
    console.error(result);
    Deno.exit(code);
  }

  return result.trim();
}

async function generateTagsArray() {
  const IMAGE = "halvardm/nessie";

  const tags = await getTags();
  const current = await getCurrentTag();

  const latestStable =
    tags.filter((tag) => REG_EXP_VERSION_STABLE.test(tag))[0];
  const latestNext = tags.filter((tag) => REG_EXP_VERSION_NEXT.test(tag))[0];

  const outputArray = [`${IMAGE}:${current}`];

  try {
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

    await Deno.stdout.write(encoder.encode(result + "\n"));
  } catch (e) {
    console.log({ current, latestStable, latestNext, outputArray });
    console.error(e);
    Deno.exit(1);
  }
}

await generateTagsArray();

Deno.exit(0);
