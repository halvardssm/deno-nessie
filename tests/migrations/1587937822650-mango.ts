import { Schema } from "../../mod.ts";

export const up = (scema: Schema): void => {
  scema.create("mango", (table) => {
    table.id();
    table.string("col_1", 10);
    table.timestamps();
  });
};

export const down = (schema: Schema): void => {
  schema.drop("mango");
};
