import { Migration } from "../../mod.ts";

export const up: Migration = () => {
  return "CREATE TABLE testTable1 (id int);";
};

export const down: Migration = () => {
  return "DROP TABLE testTable1";
};
