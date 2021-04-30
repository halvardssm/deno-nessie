import type { Info } from "../types.ts";
import { AbstractClient } from "../clients/AbstractClient.ts";

export type AbstractMigrationProps<Client> = {
  client: Client;
};

// deno-lint-ignore no-explicit-any
export abstract class AbstractMigration<T extends AbstractClient<any> = any> {
  protected client: T["client"];

  protected constructor({ client }: AbstractMigrationProps<T["client"]>) {
    this.client = client;
  }

  abstract up(exposedObject: Info): Promise<void>;

  abstract down(exposedObject: Info): Promise<void>;
}
