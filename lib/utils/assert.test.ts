import { describe, it } from "@std/testing/bdd";
import { assertThrows } from "@std/assert";
import { assertCommandOutput } from "./assert.ts";

describe("unit assert", () => {
  describe("assertCommandOutput", () => {
    const te = new TextEncoder();
    const successfullCommand: Deno.CommandOutput = {
      code: 0,
      stdout: te.encode("success"),
      stderr: te.encode("error"),
      success: true,
      signal: null,
    };
    const failedCommand: Deno.CommandOutput = {
      code: 1,
      stdout: te.encode("success"),
      stderr: te.encode("error"),
      success: false,
      signal: null,
    };

    it("successfull command", () => {
      assertCommandOutput(successfullCommand);
      assertThrows(
        () =>
          assertCommandOutput(successfullCommand, { expectedStatus: false }),
        Error,
        "Values are not equal: Command exited with status '0' (success), expected 'false', message:\nerror",
      );
    });

    it("failed command", () => {
      assertCommandOutput(failedCommand, { expectedStatus: false });
      assertThrows(
        () => assertCommandOutput(failedCommand, { expectedStatus: true }),
        Error,
        "Values are not equal: Command exited with status '1' (fail), expected 'true', message:\nerror",
      );
    });

    it("stdoutEquals", () => {
      assertCommandOutput(successfullCommand, { stdoutEquals: "success" });
      assertThrows(
        () =>
          assertCommandOutput(successfullCommand, { stdoutEquals: "error" }),
        Error,
        "Values are not equal: stdout equals",
      );
    });

    it("stderrEquals", () => {
      assertCommandOutput(successfullCommand, { stderrEquals: "error" });
      assertThrows(
        () =>
          assertCommandOutput(successfullCommand, { stderrEquals: "success" }),
        Error,
        "Values are not equal: stderr equals",
      );
    });

    it("stdoutIncludes", () => {
      assertCommandOutput(successfullCommand, { stdoutIncludes: "success" });
      assertThrows(
        () =>
          assertCommandOutput(successfullCommand, { stdoutIncludes: "error" }),
        Error,
        "stdout includes",
      );
    });

    it("stderrIncludes", () => {
      assertCommandOutput(successfullCommand, { stderrIncludes: "error" });
      assertThrows(
        () =>
          assertCommandOutput(successfullCommand, {
            stderrIncludes: "success",
          }),
        Error,
        "stderr includes",
      );
    });

    it("stdoutIncludes array", () => {
      assertCommandOutput(successfullCommand, { stdoutIncludes: ["success"] });
      assertThrows(
        () =>
          assertCommandOutput(successfullCommand, {
            stdoutIncludes: ["error"],
          }),
        Error,
        "stdout includes",
      );
    });

    it("stderrIncludes array", () => {
      assertCommandOutput(successfullCommand, { stderrIncludes: ["error"] });
      assertThrows(
        () =>
          assertCommandOutput(successfullCommand, {
            stderrIncludes: ["success"],
          }),
        Error,
        "stderr includes",
      );
    });
  });
});
