import { assert, assertEquals } from "@std/assert";
import {
  arrayIsUnique,
  getDurationFromTimestamp,
  getLogger,
  isFileUrl,
  isMigrationFile,
  isRemoteUrl,
  isUrl,
} from "./utils.ts";

Deno.test("isUrl", () => {
  assert(isUrl("file:///a.ts"));
  assert(isUrl("https://a.com/a.ts"));
  assert(isRemoteUrl("http://a.com/a.ts"));
  assert(isFileUrl("file:///a.ts"));
  assert(!isUrl("./a.ts"));
  assert(!isRemoteUrl("file:///a.ts"));
});

Deno.test("isMigrationFile", () => {
  assert(isMigrationFile("20240101120000_create_users.ts"));
  assert(!isMigrationFile("20240101120000-create-users.ts"));
  assert(!isMigrationFile("20240101120000_Create_users.ts"));
  assert(!isMigrationFile("create_users.ts"));
  assert(!isMigrationFile(`20240101120000_${"a".repeat(100)}.ts`));
});

Deno.test("arrayIsUnique", () => {
  assert(arrayIsUnique([1, 2, 3]));
  assert(!arrayIsUnique([1, 2, 2]));
});

Deno.test("getDurationFromTimestamp", () => {
  assertEquals(getDurationFromTimestamp(0, 1500), "1.50");
});

Deno.test("getLogger is silent unless debug", () => {
  const log = console.log;
  const lines: unknown[] = [];
  console.log = (...args) => lines.push(...args);
  try {
    getLogger()("hidden", "t");
    assertEquals(lines, []);
    getLogger(true)("shown", "t");
    assertEquals(lines, ["t: ", "shown"]);
  } finally {
    console.log = log;
  }
});
