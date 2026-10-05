import { runCommand } from "@stdx/cli";
import { yellow } from "@std/fmt/colors";
import { cli } from "./commands.ts";
import { NessieError } from "../utils/errors.ts";

/** The nessie command, with its subcommands, to run with `runCommand` */
export { cli } from "./commands.ts";
export * from "./state.ts";

/**
 * Runs the nessie CLI, and reports errors on stderr. A {@linkcode NessieError}
 * prints its message; other errors, which are most likely from the database or
 * the config, are printed in full.
 *
 * @param args the arguments, usually `Deno.args`
 * @returns the exit code: `0` on success, `1` for a failure, and `2` for a
 * usage error, such as an unknown flag
 */
export async function runCli(args: readonly string[]): Promise<number> {
  try {
    return await runCommand(cli, args);
  } catch (e) {
    if (e instanceof NessieError) {
      console.error(e.message);
    } else {
      console.error(
        e,
        "\n",
        yellow(
          "This error is most likely unrelated to Nessie, and is probably related to the client, the connection config or the query you are trying to execute.",
        ),
      );
    }
    return 1;
  }
}
