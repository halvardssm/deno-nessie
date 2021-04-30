import type { Info } from "../types.ts";
import { AbstractClient } from "../clients/AbstractClient.ts";

export type AbstractSeedProps<Client> = {
  client: Client;
};

// deno-lint-ignore no-explicit-any
export abstract class AbstractSeed<T extends AbstractClient<any> = any> {
  protected client: T["client"];

  protected constructor({ client }: AbstractSeedProps<T["client"]>) {
    this.client = client;
  }

  abstract run(exposedObject: Info): Promise<void>;
}
