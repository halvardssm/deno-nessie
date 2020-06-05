import { Column } from "./Column.ts";
import {
  ColumnTypes,
  typeMap,
  TypeMapEl,
  EnumColumn,
  TableConstraints,
} from "./TypeUtils.ts";
import { DBDialects } from "../types.ts";

/** The table class exposed in the second argument `schema.create()` method.
 * 
 * By using this exposed class, you can add columns and return it as a sql string using `toSql()`.
 */
export class Table {
  private dialect: DBDialects;
  private tableName: string;
  private columns: Column[];
  private customColumns?: string[];
  private constraints: TableConstraints = {
    unique: [],
    index: [],
    enums: [],
    updatedAt: false,
  };
  private sql: string[] = [];

  constructor(name: string, dbDialect: DBDialects = "pg") {
    this.tableName = name;
    this.columns = [];
    this.dialect = dbDialect;
  }

  /** Outputs the SQL query. */
  toString(pretty?: boolean): string {
    if (pretty) {
      return this.toArray().join("\n");
    } else {
      return this.toArray().join(" ");
    }
  }

  /** Outputs the SQL query. */
  toArray(): string[] {
    this.sql = [];

    this._pushToSqlArray(this._addUpdatedAtFunction());

    this._pushToSqlArray(
      ...this.constraints.enums.map((enumCol) => this._enumHandler(enumCol)),
    );

    let table = this._tableHandler() + this._columnHandler();

    this._pushToSqlArray(table);

    this._pushToSqlArray(
      ...this.constraints.unique.map((el) => this._uniqueHandler(el)),
    );

    this._pushToSqlArray(this._uniqueHandler());

    this._pushToSqlArray(
      ...this.constraints.index.map((el) => this._indexHandler(el)),
    );

    this._pushToSqlArray(...this._updatedAtHandler());

    return this.sql;
  }

  private _pushToSqlArray(...queries: string[]) {
    queries = queries.filter((el) => el !== "");
    this.sql.push(...queries);
  }

  /** Helper method for pushing to column. */
  private _pushColumn(
    name: string,
    type: ColumnTypes | string | TypeMapEl,
    input1?: number | string[],
    input2?: number,
    columnfn?: (column: Column) => Column | void,
  ): Column {
    if (typeof type !== "string") {
      type = type[this.dialect];
    }

    const column = new Column(name, type, input1, input2, this.dialect);

    if (columnfn) {
      columnfn(column);
    }

    this.columns.push(column);
    return column;
  }

  /** Generates create table query dependent on dialect. */
  private _tableHandler() {
    return `CREATE${this.constraints.isTemporary ? " TEMPORARY" : ""} TABLE${
      this.constraints.ifNotExists ? " IF NOT EXISTS" : ""
    } ${this.tableName}`;
  }

  /** Generates column query dependent on dialect. */
  private _columnHandler() {
    const allColumns = this.columns.map((el) => el.toSql());

    if (this.customColumns) allColumns.push(...this.customColumns);

    return ` (${allColumns.join(", ")});`;
  }

  /** Generates enum query dependent on dialect. In postgres, this will be stored as the column name */
  private _enumHandler(enumCol: EnumColumn): string {
    switch (this.dialect) {
      case "pg":
        return `CREATE TYPE ${enumCol.name} AS ENUM (${
          enumCol.columns.join(", ")
        });`;
      default:
        return "";
    }
  }

  /** Generates unique query dependent on dialect. */
  private _uniqueHandler(uniqueArray?: string[]) {
    const uniqueType = uniqueArray ? "UNIQUE" : "PRIMARY KEY";
    const uniqueString = uniqueArray
      ? uniqueArray.join(", ")
      : this.constraints.primary?.join(", ");

    if (!uniqueString) return "";

    switch (this.dialect) {
      case "sqlite3":
        return uniqueArray
          ? `CREATE UNIQUE INDEX ${this.tableName}_${
            uniqueArray.join("_")
          } ON ${this.tableName} (${uniqueString});`
          : "";
      default:
        return `ALTER TABLE ${this.tableName} ADD ${uniqueType} (${uniqueString});`;
    }
  }

  /** Generates index query dependent on dialect. */
  private _indexHandler(index: string) {
    switch (this.dialect) {
      case "sqlite3":
        return `CREATE INDEX ${this.tableName}_${index} ON ${this.tableName} (${index});`;
      case "mysql":
        return `ALTER TABLE ${this.tableName} ADD INDEX ${index} (${index});`;
      case "pg":
      default:
        return `CREATE INDEX ON ${this.tableName} (${index});`;
    }
  }

  /** Generates updated at query dependent on dialect. */
  private _addUpdatedAtFunction() {
    if (!this.constraints.updatedAt) return "";

    switch (this.dialect) {
      case "pg":
        return `CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ language 'plpgsql';`;
      default:
        return "";
    }
  }

  /** Generates updated at query dependent on dialect. */
  private _updatedAtHandler() {
    if (!this.constraints.updatedAt) return "";

    switch (this.dialect) {
      case "sqlite3":
        return [
          "DROP TRIGGER IF EXISTS set_timestamp;",
          `CREATE TRIGGER set_timestamp BEFORE UPDATE ON ${this.tableName} FOR EACH ROW BEGIN UPDATE ${this.tableName} SET updated_at = CURRENT_TIMESTAMP WHERE id=OLD.id; END;`,
        ];
      case "pg":
        return [
          `DROP TRIGGER IF EXISTS set_timestamp on ${this.tableName};`,
          `CREATE TRIGGER set_timestamp BEFORE UPDATE ON ${this.tableName} FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();`,
        ];
      case "mysql":
      default:
        return [];
    }
  }

  /** Generates updated at string for column dependent on dialect. */
  private _getUpdatedAtString() {
    switch (this.dialect) {
      case "mysql":
        return "on update current_timestamp";
      default:
        return "";
    }
  }

  /** Adds `IF NOT EXISTS` to the table creation query */
  ifNotExists() {
    this.constraints.ifNotExists = true;
  }

  /** Adds `TEMPORARY` to the table creation query */
  isTemporary() {
    this.constraints.isTemporary = true;
  }

  /** Adds a custom column to the table. */
  custom(string: string) {
    this.customColumns
      ? this.customColumns.push(string)
      : this.customColumns = [string];
  }

  /** Adds unique column(s) to the table. */
  unique(col: string | string[]) {
    if (typeof col === "string") col = [col];
    this.constraints.unique
      ? this.constraints.unique.push(col)
      : this.constraints.unique = [col];

    return this;
  }

  /** Adds primary column(s) to the table. */
  primary(...col: string[]) {
    this.constraints.primary = col;

    return this;
  }

  /** Adds index column(s) to the table. */
  index(...col: string[]) {
    this.constraints.index
      ? this.constraints.index.push(...col)
      : this.constraints.index = col;

    return this;
  }

  // ******* Integers *******

  /** Adds an `id` column to the table. Id is a bigint column with auto increment.*/
  id() {
    this.bigIncrements("id").primary();
  }

  /** Adds bigint column with auto increment to the table. */
  bigIncrements(name: string): Column {
    return this._pushColumn(
      name,
      typeMap.bigIncrements,
      undefined,
      undefined,
      (col) => col.autoIncrement(),
    );
  }

  /** Adds a bigint column to the table. */
  bigInteger(name: string): Column {
    return this._pushColumn(name, typeMap.bigInteger);
  }

  /** Adds a binary column to the table. */
  binary(name: string): Column {
    return this._pushColumn(name, typeMap.binary);
  }

  /** Adds a bit column to the table. */
  bit(name: string): Column {
    return this._pushColumn(name, typeMap.bit);
  }

  /** Adds a increments column to the table. */
  increments(name: string): Column {
    return this._pushColumn(
      name,
      typeMap.increments,
      undefined,
      undefined,
      (col) => col.autoIncrement(),
    );
  }

  /** Adds an integer column to the table. */
  integer(name: string): Column {
    return this._pushColumn(name, typeMap.integer);
  }

  /** Adds a small int column with auto increment to the table. */
  smallIncrements(name: string): Column {
    return this._pushColumn(
      name,
      typeMap.smallIncrements,
      undefined,
      undefined,
      (col) => col.autoIncrement(),
    );
  }

  /** Adds a small int column to the table. */
  smallInteger(name: string): Column {
    return this._pushColumn(name, typeMap.smallInteger);
  }

  // ******* Doubles *******

  /** Adds a decimal column to the table. */
  numeric(
    name: string,
    before: number = 8,
    after: number = 2,
  ): Column {
    return this._pushColumn(
      name,
      typeMap.numeric,
      before,
      after,
    );
  }

  /** Adds a double or 8-bit single precision float column to the table. */
  double(
    name: string,
    before: number = 8,
    after: number = 2,
  ): Column {
    if (this.dialect === "pg") {
      return this._pushColumn(name, typeMap.double);
    } else {
      return this._pushColumn(
        name,
        typeMap.double,
        before,
        after,
      );
    }
  }

  /** Adds a real or 4-bit single precision float column to the table. */
  real(
    name: string,
    before: number = 8,
    after: number = 2,
  ): Column {
    if (this.dialect === "pg") {
      return this._pushColumn(name, typeMap.real);
    } else {
      return this._pushColumn(
        name,
        typeMap.real,
        before,
        after,
      );
    }
  }

  /** Adds a money or decimal column to the table. */
  money(name: string): Column {
    return this._pushColumn(name, typeMap.money);
  }

  // ******* Strings *******

  /** Adds a char column with length to the table. */
  char(name: string, length: number): Column {
    return this._pushColumn(name, typeMap.char, length);
  }

  /** Adds a varchar column with length to the table. */
  string(name: string, length: number): Column {
    return this._pushColumn(name, typeMap.string, length);
  }

  /** Adds a text column to the table. */
  text(name: string): Column {
    return this._pushColumn(name, typeMap.text);
  }

  // ******* Dates *******

  /** Adds a `created_at` column to the table. */
  createdAt() {
    this.timestamp("created_at").default("current_timestamp", true);
  }

  /** Adds a `created_at` column with timezone to the table. */
  createdAtTz() {
    this.timestampTz("created_at").default("current_timestamp", true);
  }

  /** Adds a date column to the table. */
  date(name: string): Column {
    return this._pushColumn(name, typeMap.date);
  }

  /** Adds a datetime column to the table. 
	   * Postgres: timestamp
	   * MySQL: datetime
	   */
  dateTime(name: string, length: number = 0): Column {
    return this.timestamp(name, length);
  }

  /** Adds a datetime column with timezone to the table. 
	   * Postgres: timestamp
	   * MySQL: datetime
	   */
  dateTimeTz(name: string, length: number = 0): Column {
    return this.timestampTz(name, length);
  }

  /** Adds a time column to the table. */
  time(name: string, length: number = 0): Column {
    return this._pushColumn(name, typeMap.time, length);
  }

  /** Adds a time column with timezone to the table. */
  timeTz(name: string, length: number = 0): Column {
    return this._pushColumn(name, typeMap.timeTz, length);
  }

  /** Adds a timestamp column to the table. */
  timestamp(name: string, length: number = 0): Column {
    return this._pushColumn(name, typeMap.timestamp, length);
  }

  /** Adds a timestamp column with timezone to the table. */
  timestampTz(name: string, length: number = 0): Column {
    return this._pushColumn(name, typeMap.timestampTz, length);
  }

  /** Adds timestamps columns to the table. 
	   * 
	   * Creates created_at and updated_at with defaults, 
	   * and updated_at with auto updating of current timestamp
	   */
  timestamps(): void {
    this.createdAt();
    this.updatedAt();
  }

  /** Adds timestamps columns with timezone to the table. 
	   * 
	   * Creates created_at and updated_at with defaults, 
	   * and updated_at with auto updating of current timestamp
	   */
  timestampsTz(): void {
    this.createdAtTz();
    this.updatedAtTz();
  }

  /** Adds an updated_at column with auto update of current timestamp to the table. */
  updatedAt() {
    this.timestamp("updated_at").default("current_timestamp", true).custom(
      this._getUpdatedAtString(),
    );
    this.constraints.updatedAt = true;
  }

  /** Adds an updated_at column with auto update and timezone of current timestamp to the table. */
  updatedAtTz() {
    this.timestampTz("updated_at").default("current_timestamp", true).custom(
      this._getUpdatedAtString(),
    );
    this.constraints.updatedAt = true;
  }

  // ******* Mathematical *******

  /** Adds a point column to the table. */
  point(name: string): Column {
    return this._pushColumn(name, "point");
  }

  /** Adds a polygon column to the table. */
  polygon(name: string): Column {
    return this._pushColumn(name, "polygon");
  }

  // ******* Other *******

  /** Adds a boolean column to the table. */
  boolean(name: string): Column {
    return this._pushColumn(
      name,
      typeMap.boolean,
      this.dialect === "mysql" ? 1 : undefined,
    );
  }

  /** Adds an enum column to the table. */
  enum(
    name: string,
    array: string[],
    typeName: string = name,
  ): Column {
    array = array.map((el) => `'${el}'`);

    const newEnum: EnumColumn = { name: typeName, columns: array };

    if (!this.constraints.enums) {
      this.constraints.enums = [newEnum];
    }

    this.constraints.enums.push(newEnum);

    return this._pushColumn(
      name,
      this.dialect === "pg"
        ? typeName
        : this.dialect === "mysql"
        ? "ENUM"
        : "TEXT",
      undefined,
      undefined,
      (col) =>
        this.dialect === "mysql" ? col.custom(`(${array.join(", ")})`)
        : this.dialect === "sqlite3"
        ? col.custom(`CHECK(${name} IN (${array.join(", ")}) )`)
        : col,
    );
  }

  /** Adds an ip address column to the table. */
  ipAddress(name: string): Column {
    if (this.dialect === "pg") {
      return this._pushColumn(name, "inet");
    } else {
      return this.string(name, 50);
    }
  }

  /** Adds a json column to the table. */
  json(name: string): Column {
    return this._pushColumn(name, "json");
  }

  /** Adds a jsonb column to the table. */
  jsonb(name: string): Column {
    return this._pushColumn(name, typeMap.jsonb);
  }

  /** Adds a mac address(8) column to the table. */
  macAddress(name: string, isMacAddress8: boolean = false): Column {
    if (this.dialect === "pg") {
      return this._pushColumn(name, `macaddr${isMacAddress8 ? "8" : ""}`);
    } else {
      return this.string(name, isMacAddress8 ? 23 : 17);
    }
  }

  /** Adds a mac address 8 column to the table. */
  macAddress8(name: string): Column {
    return this.macAddress(name, true);
  }

  /** Adds an uuid column to the table. */
  uuid(name: string): Column {
    if (this.dialect === "pg") {
      return this._pushColumn(name, "uuid");
    } else {
      return this.string(name, 36);
    }
  }
}

export default Table;
