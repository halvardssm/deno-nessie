/**
 * The error nessie throws for failures the user can fix, such as an invalid
 * config, a missing migration file or a bad argument. The CLI prints only its
 * message. Errors from the database are not wrapped in it.
 *
 * @example
 * ```ts
 * import { NessieError } from "@halvardm/nessie";
 * import { assert } from "@std/assert";
 *
 * const error = new NessieError("Config file is not found");
 * assert(error instanceof Error);
 * assert(error.name === "NessieError");
 * ```
 */
export class NessieError extends Error {
  /**
   * Creates the error.
   *
   * @param message what went wrong, and how to fix it, for the user
   * @param options the standard error options, e.g. the `cause`
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NessieError";
  }
}
