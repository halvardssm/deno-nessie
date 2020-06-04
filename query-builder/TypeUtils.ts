export type DefaultValueT = string | number | boolean | object | null

export type ColumnTypeSql =
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

export type TypePostgresBigInt = "bigint" | "int8";
export type TypePostgresBigSerial = "bigint" | "int8";
export type TypePostgresVarBit = "bit varying" | "varbit";
export type TypePostgresBoolean = "boolean" | "bool";
export type TypePostgresChar = "character" | "char";
export type TypePostgresVarChar = "character varying" | "varchar";
export type TypePostgresFloat8 = "double precision" | "float8";
export type TypePostgresInt = "integer" | "int" | "int4";
export type TypePostgresDecimal = "numeric" | "decimal";
export type TypePostgresReal = "real" | "float4";
export type TypePostgresSmallInt = "smallint" | "int2";
export type TypePostgresSmallSerial = "smallserial" | "serial2";
export type TypePostgresSerial = "serial" | "serial4";

export type ColumnTypePostgres =
  | TypePostgresBigInt
  | TypePostgresBigSerial
  | TypePostgresVarBit
  | TypePostgresBoolean
  | TypePostgresChar
  | TypePostgresVarChar
  | TypePostgresFloat8
  | TypePostgresInt
  | TypePostgresDecimal
  | TypePostgresReal
  | TypePostgresSmallInt
  | TypePostgresSmallSerial
  | TypePostgresSerial
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

export type ColumnTypeMySql =
  | "tinyint"
  | "smallint"
  | "mediumint"
  | "int"
  | "bigint"
  | "decimal"
  | "float"
  | "double"
  | "bit"
  | "char"
  | "varchar"
  | "binary"
  | "varbinary"
  | "tinyblob"
  | "blob"
  | "mediumblob"
  | "longblob"
  | "tinytext"
  | "text"
  | "mediumtext"
  | "longtext"
  | "longtext"
  | "enum"
  | "set"
  | "date"
  | "time"
  | "datetime"
  | "timestamp"
  | "year"
  | "geometry"
  | "point"
  | "linestring"
  | "polygon"
  | "geometrycollection"
  | "multilinestring"
  | "multipoint"
  | "multipolygon"
  | "json";
export type ColumnTypeSQLite = "integer" | "text" | "blob" | "real" | "numeric";

export type ColumnTypes =
  | ColumnTypeSql
  | ColumnTypePostgres
  | ColumnTypeMySql
  | ColumnTypeSQLite;

export type TypeMapEl = {
  pg: ColumnTypePostgres;
  mysql: ColumnTypeMySql | ColumnTypes;
  sqlite3: ColumnTypes;
};
export type TypeMapType = {
  [any: string]: TypeMapEl;
};

export interface EnumColumn {
  name: string;
  columns: string[];
}

export interface TableConstraints {
  unique: string[][];
  primary?: string[];
  index: string[];
  enums: EnumColumn[];
  updatedAt: boolean;
  ifNotExists?: boolean;
  isTemporary?: boolean;
}

export const typeMap: TypeMapType = {
  bigIncrements: { pg: "bigserial", mysql: "bigint", sqlite3: "bigint" },
  bigInteger: { pg: "bigint", mysql: "bigint", sqlite3: "bigint" },
  binary: { pg: "bytea", mysql: "longblob", sqlite3: "blob" },
  bit: { pg: "bit", mysql: "bit", sqlite3: "blob" },
  boolean: { pg: "boolean", mysql: "tinyint", sqlite3: "boolean" },
  increments: { pg: "serial", mysql: "int", sqlite3: "int" },
  integer: { pg: "integer", mysql: "int", sqlite3: "int" },
  smallIncrements: {
    pg: "smallserial",
    mysql: "smallint",
    sqlite3: "smallint",
  },
  smallInteger: { pg: "smallint", mysql: "smallint", sqlite3: "smallint" },
  real: { pg: "real", mysql: "float", sqlite3: "float" },
  double: { pg: "float8", mysql: "double", sqlite3: "double" },
  numeric: { pg: "numeric", mysql: "numeric", sqlite3: "decimal" },
  money: { pg: "money", mysql: "decimal", sqlite3: "decimal" },
  char: { pg: "char", mysql: "char", sqlite3: "char" },
  string: { pg: "varchar", mysql: "varchar", sqlite3: "varchar" },
  text: { pg: "text", mysql: "longtext", sqlite3: "text" },
  jsonb: { pg: "jsonb", mysql: "json", sqlite3: "json" },
  date: { pg: "date", mysql: "date", sqlite3: "date" },
  dateTime: { pg: "timestamp", mysql: "datetime", sqlite3: "datetime" },
  time: { pg: "time", mysql: "time", sqlite3: "time" },
  timeTz: { pg: "timetz", mysql: "time", sqlite3: "time" },
  timestamp: { pg: "timestamp", mysql: "timestamp", sqlite3: "timestamp" },
  timestampTz: { pg: "timestamptz", mysql: "datetime", sqlite3: "datetime" },
};
