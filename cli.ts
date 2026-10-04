/**
 * The nessie command line interface.
 *
 * ```sh
 * deno install -g -A -n nessie jsr:@halvardm/nessie/cli
 *
 * nessie init --dialect sqlite   # config file, and migration and seed folders
 * nessie make:migration --name create_users
 * nessie migrate                 # run pending migrations, or --amount 1
 * nessie status                  # what is applied, pending and modified
 * nessie rollback                # revert the latest migration, or --amount all
 * nessie seed                    # run the seeds, or --matcher users
 * nessie <command> --help        # the options of a command
 * ```
 *
 * @module
 */
import { runCli } from "./lib/cli/mod.ts";

Deno.exit(await runCli(Deno.args));
