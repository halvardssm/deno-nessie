import { Table } from "./Table.ts";

export type dbDialects = "pg" | "mysql" | "sqlite";

/** The schema class exposed in the `up()` and `down()` methods in the migration files.
 * 
 * By using this exposed class, you can generate sql strings via the helper methods`.
 */
export class Schema {
  query: string = "";

  /** Method for exposing a Table instance for creating a table with columns */
  create(
    name: string,
    createfn: (table: Table) => void,
    dialect: dbDialects = "pg",
  ): string {
    const table = new Table(name, dialect);

    createfn(table);

    const sql = table.toSql();

    this.query += sql;

    return sql;
  }

  /** Adds a custom query string to the migration */
  queryString(queryString: string) {
    this.query += queryString;
  }

  /** Drops a table */
  drop(
    name: string | string[],
    ifExists: boolean = false,
    cascade: boolean = false,
  ) {
    if (typeof name === "string") name = [name];

    const sql = `DROP TABLE${ifExists ? " IF EXISTS" : ""} ${name.join(
      ", ",
    )}${cascade ? " CASCADE" : ""};`;

    this.query += sql;

    return sql;
  }

  /** Generates a string for checking if a table exists */
  static hasTable(name: string) {
    return `SELECT to_regclass('${name}');`;
  }
}

export default Schema;
