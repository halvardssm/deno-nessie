import {
  AbstractMigration,
  AbstractSeed,
  MigrationClient,
  PostgresMigrationClient,
} from "../mod.ts";

// This is a custom abstract migration class which can be used in the migration files
export abstract class CustomAbstractMigration<
  // deno-lint-ignore no-explicit-any
  T extends MigrationClient<any> = any,
> extends AbstractMigration<T> {
  someHelperFunction() {
    console.log("Hey, I am available to all child classes!");
  }
}

// I want to always use postres client in this class
export abstract class CustomAbstractSeed
  extends AbstractSeed<PostgresMigrationClient> {
  someHelperFunction() {
    console.log("Hey, I am available to all child classes!");
  }
}
