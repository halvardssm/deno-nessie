import type { AbstractMigrationClient, Context } from "../mod.ts";

export type AbstractSeedProps<
  // deno-lint-ignore no-explicit-any
  Client extends AbstractMigrationClient<any>,
> = {
  client: Client["client"];
};

export abstract class AbstractSeed<
  // deno-lint-ignore no-explicit-any
  T extends AbstractMigrationClient<any> = any,
> {
  protected client: T["client"];

  protected constructor({ client }: AbstractSeedProps<T>) {
    this.client = client;
  }

  abstract run(ctx: Context): Promise<void>;
}
