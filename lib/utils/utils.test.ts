import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  arrayIsUnique,
  isFileUrl,
  isMigrationFile,
  isRemoteUrl,
  isUrl,
} from "./utils.ts";

describe("unit utils", () => {
  describe("isUrl", () => {
    it(".", () => {
      assertEquals(isUrl("."), false);
    });
    it("./", () => {
      assertEquals(isUrl("./"), false);
    });
    it("/", () => {
      assertEquals(isUrl("/"), false);
    });
    it("./tester", () => {
      assertEquals(isUrl("./tester"), false);
    });
    it("http://tester.com/somefile.ts", () => {
      assertEquals(isUrl("http://tester.com/somefile.ts"), true);
    });
    it("https://tester.com/somefile.ts", () => {
      assertEquals(isUrl("https://tester.com/somefile.ts"), true);
    });
    it("file://tester/somefile.ts", () => {
      assertEquals(isUrl("file://tester/somefile.ts"), true);
    });
  });

  describe("isFileUrl", () => {
    it(".", () => {
      assertEquals(isFileUrl("."), false);
    });
    it("./", () => {
      assertEquals(isFileUrl("./"), false);
    });
    it("/", () => {
      assertEquals(isFileUrl("/"), false);
    });
    it("./tester", () => {
      assertEquals(isFileUrl("./tester"), false);
    });
    it("http://tester.com/somefile.ts", () => {
      assertEquals(isFileUrl("http://tester.com/somefile.ts"), false);
    });
    it("https://tester.com/somefile.ts", () => {
      assertEquals(isFileUrl("https://tester.com/somefile.ts"), false);
    });
    it("file://tester/somefile.ts", () => {
      assertEquals(isFileUrl("file://tester/somefile.ts"), true);
    });
  });

  describe("isRemoteUrl", () => {
    it(".", () => {
      assertEquals(isRemoteUrl("."), false);
    });
    it("./", () => {
      assertEquals(isRemoteUrl("./"), false);
    });
    it("/", () => {
      assertEquals(isRemoteUrl("/"), false);
    });
    it("./tester", () => {
      assertEquals(isRemoteUrl("./tester"), false);
    });
    it("http://tester.com/somefile.ts", () => {
      assertEquals(isRemoteUrl("http://tester.com/somefile.ts"), true);
    });
    it("https://tester.com/somefile.ts", () => {
      assertEquals(isRemoteUrl("https://tester.com/somefile.ts"), true);
    });
    it("file://tester/somefile.ts", () => {
      assertEquals(isRemoteUrl("file://tester/somefile.ts"), false);
    });
  });

  describe("arrayIsUnique", () => {
    it("['a','a']", () => {
      assertEquals(arrayIsUnique(["a", "a"]), false);
    });
    it("['a','b']", () => {
      assertEquals(arrayIsUnique(["a", "b"]), true);
    });
    it("['a','b','a']", () => {
      assertEquals(arrayIsUnique(["a", "b", "a"]), false);
    });
  });

  describe("isMigrationFile", () => {
    it("20210508125213_test2.ts", () => {
      assertEquals(isMigrationFile("20210508125213_test2.ts"), true);
    });
    it("202105081252133_test2.ts", () => {
      assertEquals(isMigrationFile("202105081252133_test2.ts"), false);
    });
    it("2021050812521_test2.ts", () => {
      assertEquals(isMigrationFile("2021050812521_test2.ts"), false);
    });
    it("2021050812521a_test2.ts", () => {
      assertEquals(isMigrationFile("2021050812521a_test2.ts"), false);
    });
    it("20210508125213-test2.ts", () => {
      assertEquals(isMigrationFile("20210508125213-test2.ts"), false);
    });
    it("20210508125213_test2_.ts", () => {
      assertEquals(isMigrationFile("20210508125213_test2_.ts"), false);
    });
    it("20210508125213_test2.", () => {
      assertEquals(isMigrationFile("20210508125213_test2."), false);
    });
    it("20210508125213_test2", () => {
      assertEquals(isMigrationFile("20210508125213_test2"), false);
    });
    it(".20210508125213_test2.ts", () => {
      assertEquals(isMigrationFile(".20210508125213_test2.ts"), false);
    });
    it("20210508125213_test2_a.ts", () => {
      assertEquals(isMigrationFile("20210508125213_test2_a.ts"), true);
    });
  });
});
