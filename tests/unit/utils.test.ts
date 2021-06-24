import { assertEquals } from "../../deps.ts";
import {
  arrayIsUnique,
  isFileUrl,
  isMigrationFile,
  isRemoteUrl,
  isUrl,
} from "../../cli/utils.ts";

Deno.test("isUrl", () => {
  const paths = [
    { original: ".", expected: false },
    { original: "./", expected: false },
    { original: "/", expected: false },
    { original: "./tester", expected: false },
    {
      original: "http://tester.com/somefile.ts",
      expected: true,
    },
    {
      original: "https://tester.com/somefile.ts",
      expected: true,
    },
    {
      original: "file://tester/somefile.ts",
      expected: true,
    },
  ];

  paths.forEach(({ original, expected }) => {
    const actual = isUrl(original);

    assertEquals(actual, expected, `original: '${original}'`);
  });
});

Deno.test("isFileUrl", () => {
  const paths = [
    { original: ".", expected: false },
    { original: "./", expected: false },
    { original: "/", expected: false },
    { original: "./tester", expected: false },
    {
      original: "http://tester.com/somefile.ts",
      expected: false,
    },
    {
      original: "https://tester.com/somefile.ts",
      expected: false,
    },
    {
      original: "file://tester/somefile.ts",
      expected: true,
    },
  ];

  paths.forEach(({ original, expected }) => {
    const actual = isFileUrl(original);

    assertEquals(actual, expected, `original: '${original}'`);
  });
});

Deno.test("isRemoteUrl", () => {
  const paths = [
    { original: ".", expected: false },
    { original: "./", expected: false },
    { original: "/", expected: false },
    { original: "./tester", expected: false },
    {
      original: "http://tester.com/somefile.ts",
      expected: true,
    },
    {
      original: "https://tester.com/somefile.ts",
      expected: true,
    },
    {
      original: "file://tester/somefile.ts",
      expected: false,
    },
  ];

  paths.forEach(({ original, expected }) => {
    const actual = isRemoteUrl(original);

    assertEquals(actual, expected, `original: '${original}'`);
  });
});

Deno.test("arrayIsUnique", () => {
  const paths = [
    { original: ["a", "a"], expected: false },
    { original: ["a", "b"], expected: true },
    { original: ["a", "b", "a"], expected: false },
  ];

  paths.forEach(({ original, expected }) => {
    const actual = arrayIsUnique(original);

    assertEquals(actual, expected, `original: '${original}'`);
  });
});

Deno.test("isMigrationFile", () => {
  const paths = [
    { original: "20210508125213_test2.ts", expected: true },
    { original: "202105081252133_test2.ts", expected: false },
    { original: "2021050812521_test2.ts", expected: false },
    { original: "2021050812521a_test2.ts", expected: false },
    { original: "20210508125213-test2.ts", expected: false },
    { original: "20210508125213_test2_.ts", expected: false },
    { original: "20210508125213_test2.", expected: false },
    { original: "20210508125213_test2", expected: false },
    { original: ".20210508125213_test2.ts", expected: false },
    { original: "20210508125213_test2_a.ts", expected: true },
  ];

  paths.forEach(({ original, expected }) => {
    const actual = isMigrationFile(original);

    assertEquals(actual, expected, `original: '${original}'`);
  });
});
