import {
  format,
  gte,
  parse,
  SemVer,
} from "https://deno.land/std@0.202.0/semver/mod.ts";
import { tryParse } from "https://deno.land/std@0.202.0/semver/try_parse.ts";

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

  return result.split("\n").map((tag) => tryParse(tag)).filter((tag) =>
    !!tag
  ) as SemVer[];
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

  return parse(result.trim());
}

async function generateTagsArray() {
  const IMAGE = "halvardm/nessie";

  const tags = await getTags();
  const current = await getCurrentTag();

  const latestStable = tags.find((tag) => !tag.prerelease);
  const latestNext = tags.find((tag) => !!tag.prerelease);

  const outputArray = [`${IMAGE}:${format(current)}`];

  try {
    if (
      !current.prerelease.length && latestStable && gte(current, latestStable)
    ) {
      outputArray.push(`${IMAGE}:latest`);
    }

    if (latestNext && gte(current, latestNext)) {
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
