import { Table } from "./Table.ts";

export type dbDialects = "pg" | "mysql" | "sqlite";

export class Schema {
  query: string = "";

  create = (
    name: string,
    createfn: (table: Table) => void,
    dialect: dbDialects = "pg",
  ): string => {
    const table = new Table(name, dialect);

    createfn(table);

    const sql = table.toSql();

    this.query += sql;

    return sql;
  };

  queryString = (queryString: string) => {
    this.query += queryString;
  };

  drop = (
    name: string | string[],
    ifExists: boolean = false,
    cascade: boolean = false,
  ) => {
    if (typeof name === "string") name = [name];

    const sql = `DROP TABLE${ifExists ? " IF EXISTS" : ""} ${name.join(
      ", ",
    )}${cascade ? " CASCADE" : ""};`;

    this.query += sql;

    return sql;
  };

  // TODO Add Has table
  static hasTable = (name: string) => {
    return `SELECT to_regclass('${name}');`;
  };
}

export default Schema;
