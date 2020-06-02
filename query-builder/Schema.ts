import { Table } from "./Table.ts";
import { dbDialects } from "./TypeUtils.ts";

/** The schema class exposed in the `up()` and `down()` methods in the migration files.
 * 
 * By using this exposed class, you can generate sql strings via the helper methods`.
 */
export class Schema {
  query: string[] = [];
  dialect: dbDialects;

  constructor(dialenct: dbDialects = "pg") {
    this.dialect = dialenct;
  }

  /** Method for exposing a Table instance for creating a table with columns */
  create(
    name: string,
    createfn: (table: Table) => void,
  ): string[] {
    const table = new Table(name, this.dialect);

    createfn(table);

    const sql = table.toSql();

    const sqlArray = this._queryHandler(sql);

    this.query.push(...sqlArray);

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

  /** Generates a string for checking if a table exists */
  hasTable(name: string): string {
    switch (this.dialect) {
      case "mysql":
        //SELECT 1 FROM testtable LIMIT 1;
        return `show tables like '${name}';`;
      case "sqlite":
        return `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}';`;
      case "pg":
      default:
        return `SELECT to_regclass('${name}');`;
    }
  }

  /** TODO(halvardssm) This is a temporary fix which will have to be sorted out before v1.0 */
  private _queryHandler(queryString: string): string[] {
    let queries = queryString.trim().split(/(?<!\\);/);
    queries = queries
      .filter((el) => el.trim() !== "" && el.trim() !== undefined)
      .map((el) => `${el.trim().replace(/\\;/g, ";")};`);
    return queries;
  }
}

export default Schema;
