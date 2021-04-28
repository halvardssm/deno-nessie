import type { Info } from "../types.ts";

export type AbstractMigrationProps<Client> = {
  client: Client;
};

// deno-lint-ignore no-explicit-any
export abstract class AbstractMigration<Client = any> {
  protected client: Client;

  protected constructor({ client }: AbstractMigrationProps<Client>) {
    this.client = client;
  }

  abstract up(exposedObject: Info): Promise<void>;

  abstract down(exposedObject: Info): Promise<void>;
}
