import { columnTypes, dbDialects } from "./TypeUtils.ts";

/** The column class which stores the column information of a table class. */
export class Column {
  private dialect: dbDialects;
  private columnName: string;
  private columnType: columnTypes | string;
  private columnInput1?: number | string[];
  private columnInput2?: number;
  private isNullable: boolean = true;
  private defaultValue?: string;
  private customCol?: string;
  private isAutoIncrement: boolean = false;
  private isPrimary: boolean = false;
  private isUnique: boolean = false;

  constructor(
    name: string,
    type: columnTypes | string,
    input1?: number | string[],
    input2?: number,
    dbDialect: dbDialects = "pg",
  ) {
    this.columnName = name;
    this.columnType = type;
    this.columnInput1 = input1;
    this.columnInput2 = input2;
    this.dialect = dbDialect;
  }

  /** Generates a sql representation of a column */
  toSql(): string {
    let sql = `${this.columnName} ${this.columnType}`;

    sql = this._addAttributes(sql);

    return sql.trimEnd();
  }

  /** Helper method for adding attributes to the column string */
  private _addAttributes(string: string): string {
    if (this.columnInput1 !== undefined) {
      string += ` (${this.columnInput1}${
        this.columnInput2 ? `, ${this.columnInput2}` : ""
      })`;
    }

    if (this.defaultValue) {
      string += ` default ${this.defaultValue}`;
    }

    if (!this.isNullable) {
      string += " not null";
    }

    if (this.isAutoIncrement) {
      string += " AUTO_INCREMENT";
    }

    if (this.isPrimary) {
      string += " PRIMARY KEY";
    }

    if (this.isUnique) {
      string += " UNIQUE";
    }

    if (this.customCol) {
      string += ` ${this.customCol}`;
    }

    return string;
  }

  /** Adds primary key to the column string */
  primary() {
    this.isPrimary = true;
  }

  /** Adds unique constraint to the column string */
  unique() {
    this.isUnique = true;
  }

  /** Adds custom attributes to the column string */
  custom(str: string) {
    this.customCol = str;
  }

  /** Adds a default value to the column */
  default(value: string) {
    this.defaultValue = value;
    return this;
  }

  /** Makes the column nullable */
  nullable() {
    this.isNullable = true;
    return this;
  }

  /** Makes the column not nullable */
  notNullable() {
    this.isNullable = false;
    return this;
  }

  /** Makes the column auto incremental, only for integers */
  autoIncrement() {
    if (this.dialect === "mysql") {
      this.isAutoIncrement = true;
    }

    return this;
  }
}

export default { Column };
