import type { Context, MigrationClient } from "../mod.ts";

export type AbstractMigrationProps<
  // deno-lint-ignore no-explicit-any
  Client extends MigrationClient<any>,
> = {
  client: Client["client"];
};

export abstract class AbstractMigration<
  // deno-lint-ignore no-explicit-any
  T extends MigrationClient<any> = any,
> {
  protected client: T["client"];

  protected constructor({ client }: AbstractMigrationProps<T>) {
    this.client = client;
  }

  abstract up(ctx: Context): Promise<void>;

  abstract down(ctx: Context): Promise<void>;
}
