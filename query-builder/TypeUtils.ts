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

export type columnTypeMySql =
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
export type columnTypeSQLite = "integer" | "text" | "blob" | "real" | "numeric";

export type columnTypes =
  | columnTypeSql
  | columnTypePostgres
  | columnTypeMySql
  | columnTypeSQLite;

export type typeMapEl = {
  pg: columnTypePostgres;
  mysql: columnTypeMySql | columnTypes;
  sqlite3: columnTypes;
};
export type typeMapType = {
  [any: string]: typeMapEl;
};

export const typeMap: typeMapType = {
  bigIncrements: { pg: "bigserial", mysql: "bigint", sqlite3: "bigint" },
  bigInteger: { pg: "bigint", mysql: "bigint", sqlite3: "bigint" },
  binary: { pg: "bytea", mysql: "longblob", sqlite3: "blob" },
  bit: { pg: "bit", mysql: "bit", sqlite3: "blob" },
  boolean: { pg: "boolean", mysql: "tinyint", sqlite3: "boolean" },
  increments: { pg: "serial", mysql: "int", sqlite3: "int" },
  integer: { pg: "integer", mysql: "int", sqlite3: "int" },
  smallIncrements: { pg: "smallserial", mysql: "smallint", sqlite3: "smallint" },
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
