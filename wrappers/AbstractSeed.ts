import type { Info } from "../types.ts";

export type AbstractSeedProps<Client> = {
  client: Client;
};

// deno-lint-ignore no-explicit-any
export abstract class AbstractSeed<Client = any> {
  protected client: Client;

  protected constructor({ client }: AbstractSeedProps<Client>) {
    this.client = client;
  }

  abstract run(exposedObject: Info): Promise<void>;
}
