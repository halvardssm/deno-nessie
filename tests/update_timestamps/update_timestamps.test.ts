import {
  assertArrayIncludes,
  assertEquals,
  fromFileUrl,
  resolve,
} from "../../deps.ts";

Deno.test({
  name: "Update timestamps",
  async fn() {
    const fileDir = resolve(fromFileUrl(import.meta.url), "..");

    for await (const dirEntry of Deno.readDir(fileDir)) {
      if (dirEntry.isFile && /.+-test\.ts/.test(dirEntry.name)) {
        await Deno.remove(resolve(fileDir, dirEntry.name));
      }
    }

    await Deno.writeTextFile(fileDir + "/999999999999-test.ts", "");
    await Deno.writeTextFile(fileDir + "/1000000000000-test.ts", "");
    await Deno.writeTextFile(fileDir + "/1587937822648-test.ts", ""); //2020-04-26 23:50:22
    await Deno.writeTextFile(fileDir + "/9999999999999-test.ts", "");
    await Deno.writeTextFile(fileDir + "/10000000000000-test.ts", "");

    const r = Deno.run({
      cmd: [
        "deno",
        "run",
        "--allow-read",
        "--allow-write",
        "--unstable",
        "../../cli.ts",
        "update_timestamps",
      ],
      cwd: "tests/update_timestamps",
      stdout: "piped",
    });

    const { code } = await r.status();

    const rawOutput = await r.output();
    r.close();

    const decoder = new TextDecoder();

    const result = decoder.decode(rawOutput).split("\n");

    if (code !== 0) {
      result.push(`Code was ${code}`);
    }

    const expected = [
      "9999999999999-test.ts => 22861120184639-test.ts",
      "1587937822648-test.ts => 20200426235022-test.ts",
      "999999999999-test.ts => 20010909034639-test.ts",
      "10000000000000-test.ts => 22861120184640-test.ts",
      "1000000000000-test.ts => 20010909034640-test.ts",
    ];

    assertEquals(code, 0, result.join("\n"));
    // assertEquals(result.length, expected.length, result.join("\n"));
    assertEquals(result.sort(), expected.sort());

    await Deno.remove(fileDir + "/22861120184639-test.ts");
    await Deno.remove(fileDir + "/20200426235022-test.ts");
    await Deno.remove(fileDir + "/20010909034639-test.ts");
    await Deno.remove(fileDir + "/20010909034640-test.ts");
    await Deno.remove(fileDir + "/22861120184640-test.ts");
  },
});
