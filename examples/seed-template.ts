import {
  ClientPostgreSQL,
  Info,
  //As this is a custom template, I want to lock the nessie version to 2.0.0
} from "https://deno.land/x/nessie@2.0.0/mod.ts";
// I can import what I want to be used in this template
import { CustomAbstractSeed } from "./abstract-classes-extended.ts";

export default class extends CustomAbstractSeed {
  async run({ dialect }: Info): Promise<void> {
    this.someHelperFunction();
  }
}
