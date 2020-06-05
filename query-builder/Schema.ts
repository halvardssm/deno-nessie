import { Table } from "./Table.ts";
import { DBDialects } from "../types.ts";

/** The schema class used to create the queries.
 * 
 * By using this exposed class, you can generate sql strings via the helper methods`.
 */
export class Schema {
  query: string[] = [];
  dialect: DBDialects;

  constructor(dialenct: DBDialects = "pg") {
    this.dialect = dialenct;
  }

  /** Generates an array to create a table with columns */
  create(
    name: string,
    createfn: (table: Table) => void,
  ): string[] {
    const table = new Table(name, this.dialect);

    createfn(table);

    this.query.push(...table.toArray());

    return this.query;
  }

  /** Adds a custom query string to the migration */
  queryString(queryString: string): string[] {
    const lastChar = queryString[queryString.length - 1];
    if (lastChar != ";") {
      queryString += ";";
    }
    this.query.push(queryString);
    return this.query;
  }

  /** Generates a string for checking if a table exists */
  hasTable(name: string): string {
    switch (this.dialect) {
      case "mysql":
        //SELECT 1 FROM testtable LIMIT 1;
        return `show tables like '${name}';`;
      case "sqlite3":
        return `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}';`;
      case "pg":
      default:
        return `SELECT to_regclass('${name}');`;
    }
  }

  /** Renames table */
  renameTable(from: string, to: string): string[] {
    switch (this.dialect) {
      case "mysql":
        this.query.push(`RENAME TABLE ${from} TO ${to};`);
        break;
      case "sqlite3":
      case "pg":
      default:
        this.query.push(`ALTER TABLE ${from} RENAME TO ${to};`);
    }
    return this.query;
  }

  /** Drops a table */
  drop(
    name: string | string[],
    ifExists: boolean = false,
    cascade: boolean = false,
  ): string[] {
    if (typeof name === "string") name = [name];

    const sql = `DROP TABLE${ifExists ? " IF EXISTS" : ""} ${
      name.join(
        ", ",
      )
    }${cascade ? " CASCADE" : ""};`;

    this.query.push(sql);

    return this.query;
  }

  /** Generates a string for checking if a column exists */
  hasColumn(tableName: string, columnName: string): string {
    switch (this.dialect) {
      case "mysql":
        return `SELECT EXISTS (SHOW COLUMNS FROM '${tableName}' LIKE '${columnName}');`;
      case "sqlite3":
        return `SELECT EXISTS (SELECT * FROM sqlite_master WHERE tbl_name = '${tableName}' AND sql = '${columnName}');`;
      case "pg":
      default:
        return `SELECT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='${tableName}' and column_name='${columnName}');`;
    }
  }

  /** Renames column */
  renameColumn(table: string, from: string, to: string): string[] {
    this.query.push(
      `ALTER TABLE ${table} RENAME${
        this.dialect !== "pg" ? " COLUMN" : ""
      } ${from} TO ${to};`,
    );

    return this.query;
  }

  /** Drops column */
  dropColumn(table: string, column: string): string[] {
    if (this.dialect !== "sqlite3") {
      this.query.push(`ALTER TABLE ${table} DROP ${column};`);
    }

    return this.query;
  }
}

export default Schema;
