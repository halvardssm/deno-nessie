import { Context, PostgresMigrationClient } from "../mod.ts";
// I can import what I want to be used in this template
import { CustomAbstractMigration } from "./abstract-classes-extended.ts";

export default class extends CustomAbstractMigration<PostgresMigrationClient> {
  // deno-lint-ignore require-await
  async up(_ctx: Context): Promise<void> {
    this.someHelperFunction();
  }

  async down(_ctx: Context): Promise<void> {
    // For this custom template, I do not want the down method to be predefined,
  }
}
