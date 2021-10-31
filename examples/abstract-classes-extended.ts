import {
  AbstractClient,
  AbstractMigration,
  AbstractSeed,
  ClientPostgreSQL,
} from "https://deno.land/x/nessie/mod.ts";

// This is a custom abstract migration class which can be used in the migration files
export class CustomAbstractMigration<T extends AbstractClient<any> = any>
  extends AbstractMigration<T> {
  someHelperFunction() {
    console.log("Hey, I am available to all child classes!");
  }
}

// I want to always use postres client in this class
export class CustomAbstractSeed extends AbstractSeed<ClientPostgreSQL> {
  someHelperFunction() {
    console.log("Hey, I am available to all child classes!");
  }
}
