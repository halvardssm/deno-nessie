import {
  AbstractMigration,
  AbstractMigrationClient,
  AbstractSeed,
  PostgresMigrationClient,
} from "../mod.ts";

// This is a custom abstract migration class which can be used in the migration files
export abstract class CustomAbstractMigration<
  T extends AbstractMigrationClient<any> = any,
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
