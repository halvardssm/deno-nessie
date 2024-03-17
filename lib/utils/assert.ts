import { assertEquals, assertStringIncludes } from "@std/assert";

export interface AssertCommandOutputResult
  extends Omit<Deno.CommandOutput, "stdout" | "stderr"> {
  stdout: string;
  stderr: string;
}

export interface AssertCommandOptions {
  expectedStatus?: boolean | number;
  stdoutEquals?: string;
  stderrEquals?: string;
  stdoutIncludes?: string | string[];
  stderrIncludes?: string | string[];
}

export function assertCommandOutput(
  output: Deno.CommandOutput,
  options: AssertCommandOptions = {},
): AssertCommandOutputResult {
  if (options.expectedStatus === undefined) {
    options.expectedStatus = true;
  }

  const comparator = typeof options.expectedStatus === "number"
    ? output.code
    : output.success;

  const status = output.success ? "success" : "fail";

  const stdout = new TextDecoder().decode(output.stdout).trim();
  const stderr = new TextDecoder().decode(output.stderr).trim();
  const msg = "\n" + (stderr || stdout);
  const errorMsg =
    `Command exited with status '${output.code}' (${status}), expected '${options.expectedStatus}', message:${msg}`;

  assertEquals(comparator, options.expectedStatus, errorMsg);

  if (options.stdoutEquals) {
    assertEquals(stdout, options.stdoutEquals, "stdout equals");
  }

  if (options.stderrEquals) {
    assertEquals(stderr, options.stderrEquals, "stderr equals");
  }

  if (options.stdoutIncludes) {
    if (!Array.isArray(options.stdoutIncludes)) {
      assertStringIncludes(
        stdout,
        options.stdoutIncludes,
        "stdout includes",
      );
    } else {
      for (const str of options.stdoutIncludes) {
        assertStringIncludes(
          stdout,
          str,
          "stdout includes",
        );
      }
    }
  }

  if (options.stderrIncludes) {
    if (!Array.isArray(options.stderrIncludes)) {
      assertStringIncludes(
        stderr,
        options.stderrIncludes,
        "stderr includes",
      );
    } else {
      for (const str of options.stderrIncludes) {
        assertStringIncludes(
          stderr,
          str,
          "stderr includes",
        );
      }
    }
  }

  return {
    code: output.code,
    signal: output.signal,
    success: output.success,
    stdout,
    stderr,
  };
}
