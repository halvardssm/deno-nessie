import { Context } from "../mod.ts";
// I can import what I want to be used in this template
import { CustomAbstractSeed } from "./abstract-classes-extended.ts";

export default class extends CustomAbstractSeed {
  // deno-lint-ignore require-await
  async run(_ctx: Context): Promise<void> {
    this.someHelperFunction();
  }
}
