import { columnTypes, dbDialects } from "./TypeUtils.ts";

/** The column class which stores the column information of a table class. */
export class Column {
  private dialect: dbDialects;
  private columnName: string;
  private columnType: columnTypes | string;
  private columnInput1?: number | string[];
  private columnInput2?: number;
  private isNullable: boolean = true;
  private defaultValue?: string | number | boolean | object | null;
  private defaultValueIsExpression?: boolean = false;
  private customCol?: string;
  private isAutoIncrement: boolean = false;
  private isPrimary: boolean = false;
  private isUnique: boolean = false;
  private isUnsigned: boolean = false;

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

    if (this.isUnsigned && this.dialect === "mysql") {
      string += " UNSIGNED";
    }

    //process this.defaultValue
    {
      let val = ``;
      if (this.defaultValue === null) {
        val += ` DEFAULT NULL`;
      } else if (typeof this.defaultValue == "number") {
        val += ` DEFAULT ${this.defaultValue}`;
      } else if (typeof this.defaultValue == "boolean") {
        val += ` DEFAULT '${this.defaultValue ? 1 : 0}'`;
      } else if (typeof this.defaultValue == "object") {
        val += ` DEFAULT '${JSON.stringify(this.defaultValue)}'`;
      } else if (
        typeof this.defaultValue == "string" && !this.defaultValueIsExpression
      ) {
        val += ` DEFAULT '${this.defaultValue}'`;
      } else if (
        typeof this.defaultValue == "string" && this.defaultValueIsExpression
      ) {
        val += ` DEFAULT ${this.defaultValue}`;
      }
      string += val;
    }

    if (!this.isNullable) {
      string += " NOT NULL";
    }

    if (this.isAutoIncrement) {
      string += this.dialect === "sqlite" ? "" : " AUTO_INCREMENT";
    }

    if (this.isPrimary) {
      string += " PRIMARY KEY";
    }

    if (this.isUnique && !this.isPrimary) {
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
    return this;
  }

  /** Adds unique constraint to the column string */
  unique() {
    this.isUnique = true;
    return this;
  }

  /** Adds custom attributes to the column string */
  custom(str: string) {
    this.customCol = str;
    return this;
  }

  /** Adds a default value to the column */
  default(
    value: string | number | boolean | object | null,
    isExpression: boolean = false,
  ) {
    this.defaultValue = value;
    this.defaultValueIsExpression = isExpression;
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
      if (!this.isPrimary) {
        this.isUnique = true;
      }
    }

    return this;
  }

  /** Makes an integer unsigned, only works for MySQL */
  unsigned() {
    this.isUnsigned = true;
    return this;
  }
}

export default { Column };
