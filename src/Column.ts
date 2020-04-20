export type columnTypeSql =
  | "BIGINT"
  | "BLOB"
  | "TEXT"
  | "CHAR"
  | "DATE"
  | "DATETIME"
  | "DECIMAL"
  | "DOUBLE"
  | "ENUM"
  | "FLOAT"
  | "INT"
  | "LONGBLOB"
  | "LONGTEXT"
  | "MEDIUMBLOB"
  | "MEDIUMTEXT"
  | "MEDIUMINT"
  | "SMALLINT"
  | "TIME"
  | "TIMESTAMP"
  | "TINYBLOB"
  | "TINYTEXT"
  | "TINYINT"
  | "VARCHAR"
  | "YEAR";

export type typePostgresBigInt = "bigint" | "int8";
export type typePostgresBigSerial = "bigint" | "int8";
export type typePostgresVarBit = "bit varying" | "varbit";
export type typePostgresBoolean = "boolean" | "bool";
export type typePostgresChar = "character" | "char";
export type typePostgresVarChar = "character varying" | "varchar";
export type typePostgresFloat8 = "double precision" | "float8";
export type typePostgresInt = "integer" | "int" | "int4";
export type typePostgresDecimal = "numeric" | "decimal";
export type typePostgresReal = "real" | "float4";
export type typePostgresSmallInt = "smallint" | "int2";
export type typePostgresSmallSerial = "smallserial" | "serial2";
export type typePostgresSerial = "serial" | "serial4";

export type columnTypePostgres =
  | typePostgresBigInt
  | typePostgresBigSerial
  | typePostgresVarBit
  | typePostgresBoolean
  | typePostgresChar
  | typePostgresVarChar
  | typePostgresFloat8
  | typePostgresInt
  | typePostgresDecimal
  | typePostgresReal
  | typePostgresSmallInt
  | typePostgresSmallSerial
  | typePostgresSerial
  | "bigserial"
  | "bit"
  | "box"
  | "bytea"
  | "cidr"
  | "circle"
  | "date"
  | "inet"
  | "interval"
  | "json"
  | "jsonb"
  | "line"
  | "lseg"
  | "macaddr"
  | "macaddr8"
  | "money"
  | "path"
  | "pg_lsn"
  | "point"
  | "polygon"
  | "text"
  | "time"
  | "timetz"
  | "timestamp"
  | "timestamptz"
  | "tsquery"
  | "tsvector"
  | "txid_snapshot"
  | "uuid"
  | "xml";

export type columnTypes = columnTypeSql | columnTypePostgres;

export interface ColumnAttributes {
  default?: string;
  nullable?: boolean;
}

export class Column {
  protected columnName: string;
  protected columnType: columnTypes | string;
  protected attributes: ColumnAttributes = {};
  protected customCol?: string;

  constructor(name: string, type: columnTypes | string) {
    this.columnName = name;
    this.columnType = type;
  }

  toSql = (): string => {
    let sql = `${this.columnName} ${this.columnType}`;

    sql = this.addAttributes(sql);

    return sql;
  };

  protected addAttributes = (string: string): string => {
    if (this.attributes.default) {
      string += ` default ${this.attributes.default}`;
    }

    if (this.attributes.nullable) {
      string += " not null";
    }

    if (this.customCol) {
      string += ` ${this.customCol}`;
    }

    return string;
  };

  custom = (str: string) => {
    this.customCol = str;
  };

  default = (value: string) => {
    this.attributes.default = value;
    return this;
  };

  nullable = (value = true) => {
    this.attributes.nullable = value;
    return this;
  };
}

export class ColumnWithInput extends Column {
  protected columnInput1: number | string[];
  protected columnInput2?: number;

  constructor(
    name: string,
    type: columnTypes | string,
    input1: number | string[],
    input2?: number,
  ) {
    super(name, type);
    this.columnInput1 = input1;
    this.columnInput2 = input2;
  }

  toSql = (): string => {
    let sql = `${this.columnName} ${this.columnType}`;

    sql += ` (${this.columnInput1}${this.columnInput2
      ? `, ${this.columnInput2}`
      : ""})`;

    sql = this.addAttributes(sql);

    return sql.trimEnd();
  };
}

export default { Column, ColumnWithInput };
