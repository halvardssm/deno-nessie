import { Table, CreateTableI } from "./Table.ts";
import { bracket } from "./utils.ts";

export interface ColumnReference {
	table: string;
	column: string;
	// TODO Add `ON DELETE` and `ON UPDATE`
}
export type columnType =
	| "BIGINT"
	| "BIT"
	| "BIT VARYING"
	| "BOOLEAN"
	| "CHAR"
	| "CHARACTER VARYING"
	| "CHARACTER"
	| "VARCHAR"
	| "DATE"
	| "DOUBLE PRECISION"
	| "INTEGER"
	| "INTERVAL"
	| "NUMERIC"
	| "DECIMAL"
	| "REAL"
	| "SMALLINT"
	| "TIME"
	| "TIMEZ"
	| "TIMESTAMP"
	| "TIMESTAMPZ"
	| "XML";

export type columnTypePostgres =
	| columnType
	| "BIGSERIAL"
	| "BYTEA"
	| "JSON"
	| "JSONB"
	| "MONEY"
	| "FLOAT8"
	| "SMALLSERIAL"
	| "SERIAL"
	| "TEXT"
	| "UUID";

export interface CreateColumnI {
	name: string;
	type: columnTypePostgres;
	length?: number;
	default?: string;
	nullable?: boolean;
	unique?: boolean;
	primaryKey?: boolean;
	comment?: string;
}

export class Column {
	query: string[] = [];
	script: string = "";
	properties: CreateColumnI;
	comment?: (tableName: string) => string;

	constructor(config: CreateColumnI) {
		this.properties = config;

		this.build();

		if (this.properties.comment) {
			this.comment = (tableName: string) => {
				return `COMMENT ON COLUMN ${tableName}.${this.properties.name} IS '${this.properties.comment}'`;
			};
		}

		this.script = this.query.join(" ");
	}

	build = (): void => {
		this.query.push(this.properties.name);
		this.query.push(this.properties.type);

		if (this.properties.length) {
			this.query.push(bracket(this.properties.length));
		}

		if (this.properties.default) {
			this.query.push("DEFAULT " + this.properties.default);
		}

		if (!this.properties.nullable) {
			this.query.push("NOT NULL");
		}
	};
}

export default { Column };
