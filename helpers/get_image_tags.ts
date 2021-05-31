import { REG_EXP_VERSION, REG_EXP_VERSION_STABLE } from "./commons.ts";

const IMAGE = "halvardm/nessie";
const versionNessie = Deno.args[0];
const versionLatestStable = Deno.args[1];
const versionLatestNext = Deno.args[2];

if (
  !REG_EXP_VERSION.test(versionNessie) ||
  !REG_EXP_VERSION_STABLE.test(versionLatestStable) ||
  !REG_EXP_VERSION.test(versionLatestNext)
) {
  console.info(
    `Version not valid, got version: '${versionNessie}', stable: '${versionLatestStable}', next: '${versionLatestNext}'`,
  );
  Deno.exit(1);
}

const outputArray = [`${IMAGE}:${versionNessie}`];
let isStable = false;

if (REG_EXP_VERSION_STABLE.test(versionNessie)) {
  isStable = true;
}

const isGreater = (a:string, b:string) => {
  const aa = a.split('.').map(el=>parseInt(el)).join('.')
  const bb = b.split('.').map(el=>parseInt(el)).join('.')
  return aa.localeCompare(bb, undefined, { numeric: true }) !== -1;
};

if (isStable && isGreater(versionNessie, versionLatestStable)) {
  outputArray.push(`${IMAGE}:latest`);
}

if (isGreater(versionNessie, versionLatestNext)) {
  outputArray.push(`${IMAGE}:next`);
}

const output = outputArray.join(",");

const encoder = new TextEncoder();
const encodedOutput = encoder.encode(output + "\n");
await Deno.stdout.write(encodedOutput);
Deno.exit(0);
