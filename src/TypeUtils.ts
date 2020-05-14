import { ClientConfig, ConnectionOptions } from "../deps.ts";

export type dbDialects = "pg" | "mysql" | "sqlite";

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
  sqlite: columnTypes;
};
export type typeMapType = {
  [any: string]: typeMapEl;
};

export const typeMap: typeMapType = {
  bigIncrements: { pg: "bigserial", mysql: "bigint", sqlite: "bigint" },
  bigInteger: { pg: "bigint", mysql: "bigint", sqlite: "bigint" },
  binary: { pg: "bytea", mysql: "longblob", sqlite: "blob" },
  bit: { pg: "bit", mysql: "bit", sqlite: "blob" },
  boolean: { pg: "boolean", mysql: "tinyint", sqlite: "boolean" },
  increments: { pg: "serial", mysql: "int", sqlite: "int" },
  integer: { pg: "integer", mysql: "int", sqlite: "int" },
  smallIncrements: { pg: "smallserial", mysql: "smallint", sqlite: "smallint" },
  smallInteger: { pg: "smallint", mysql: "smallint", sqlite: "smallint" },
  real: { pg: "real", mysql: "float", sqlite: "float" },
  double: { pg: "float8", mysql: "double", sqlite: "smallint" },
  decimal: { pg: "decimal", mysql: "decimal", sqlite: "decimal" },
  money: { pg: "money", mysql: "decimal", sqlite: "decimal" },
  char: { pg: "char", mysql: "char", sqlite: "char" },
  string: { pg: "varchar", mysql: "varchar", sqlite: "varchar" },
  text: { pg: "text", mysql: "longtext", sqlite: "text" },
  date: { pg: "date", mysql: "date", sqlite: "date" },
  dateTime: { pg: "timestamp", mysql: "datetime", sqlite: "datetime" },
  time: { pg: "time", mysql: "time", sqlite: "time" },
  timestamp: { pg: "timestamp", mysql: "timestamp", sqlite: "timestamp" },
};

export interface nessieConnection {
  host: string | "localhost" | "127.0.0.1";
  port: string | number;
  name: string;
  user: string;
  password?: string;
}

export interface nessieConfig {
  connection: ConnectionOptions | string | ClientConfig;
  migrationFolder?: string;
  dialect?: dbDialects;
}

export interface _nessieConfig {
  migrationFolder: string;
  dialect: dbDialects;
  connection: {
    pg?: ConnectionOptions | string;
    mysql?: ClientConfig;
    sqlite?: string;
  };
}
