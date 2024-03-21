import { yellow } from "@std/fmt/colors";
import { NessieError } from "./lib/utils/errors.ts";
import { mainCommand } from "./lib/cli/commands.ts";

if (import.meta.main) {
  try {
    await mainCommand.parse(Deno.args);

    Deno.exit();
  } catch (e) {
    if (e instanceof NessieError) {
      console.error(e);
    } else {
      console.error(
        e,
        "\n",
        yellow(
          "This error is most likely unrelated to Nessie, and is probably related to the client, the connection config or the query you are trying to execute.",
        ),
      );
    }
    Deno.exit(1);
  }
}
