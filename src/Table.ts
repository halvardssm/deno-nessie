import { Column, ColumnWithInput, ColumnEnum } from './Column.ts';

export interface TableConstraints {
	unique?: string[][];
	primary?: string[];
	index?: string[];
}
export class Table {
	protected tableName: string;
	protected columns: Column[];
	protected constraints: TableConstraints = {};

	constructor(name: string) {
		this.tableName = name
		this.columns = []
	}

	toSql = (): string => {
		let sql = this.tableName

		sql += " (" + this.columns.map(el => el.toSql()).join(', ') + ");"

		this.constraints.unique?.forEach((el: string[]) => {
			let result = el.join(', ')

			sql += ` ALTER TABLE ${this.tableName} ADD UNIQUE(${result});`
		})

		sql += this.constraints.primary
			? ` ALTER TABLE ${this.tableName} ADD PRIMARY KEY (${this.constraints.primary.join(', ')});`
			: ''

		this.constraints.index?.forEach(el => {
			sql += ` CREATE INDEX ON ${this.tableName} (${el})`
		})

		return sql
	}

	private pushColumn = <T extends Column>(column: T): T => {
		this.columns.push(column)
		return column
	}

	unique = (col: string | string[]) => {
		if (typeof col === "string") col = [col]
		this.constraints.unique
			? this.constraints.unique.push(col)
			: this.constraints.unique = [col]

		return this
	}

	primary = (col: string) => {
		this.constraints.primary?.push(col)
		return this
	}

	index = (col: string) => {
		this.constraints.index?.push(col)
		return this
	}

	id = () => {
		this.bigIncrements('id')
	}

	bigIncrements = (name: string): Column => {
		return this.pushColumn(new Column(name, "bigserial"))
	}

	bigInteger = (name: string): Column => {
		return this.pushColumn(new Column(name, "bigint"))
	}

	binary = (name: string): Column => {
		return this.pushColumn(new Column(name, "bytea"))
	}

	boolean = (name: string): Column => {
		return this.pushColumn(new Column(name, "boolean"))
	}

	char = (name: string, length: number): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "character", length))
	}

	date = (name: string): Column => {
		return this.pushColumn(new Column(name, "date"))
	}

	dateTime = (name: string, length: number = 0): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "timestamp", length))
	}

	dateTimeTz = (name: string, length: number = 0): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "timestamptz", length))
	}

	decimal = (name: string, before: number = 8, after: number = 2): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "decimal", before, after))
	}

	double = (name: string, before: number = 8, after: number = 2): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "float8", before, after))
	}

	enum = (name: string, array: string[]): ColumnEnum => {
		return this.pushColumn(new ColumnEnum(name, 'ENUM', array))
		//TODO Add support for enum
	}

	float = (name: string, before: number = 8, after: number = 2): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "float8", before, after))
		//TODO DOUBLE CHECK return THIS WITH POSTGRES
	}

	increments = (name: string): Column => {
		return this.pushColumn(new Column(name, "serial"))
	}

	integer = (name: string): Column => {
		return this.pushColumn(new Column(name, "integer"))
	}

	ipAddress = (name: string): Column => {
		return this.pushColumn(new Column(name, "inet"))
	}

	json = (name: string): Column => {
		return this.pushColumn(new Column(name, "json"))
	}

	jsonb = (name: string): Column => {
		return this.pushColumn(new Column(name, "jsonb"))
	}

	macAddress = (name: string): Column => {
		return this.pushColumn(new Column(name, "macaddr"))
	}

	macAddress8 = (name: string): Column => {
		return this.pushColumn(new Column(name, "macaddr8"))
	}

	point = (name: string): Column => {
		return this.pushColumn(new Column(name, "point"))
	}

	polygon = (name: string): Column => {
		return this.pushColumn(new Column(name, "polygon"))
	}

	smallIncrements = (name: string): Column => {
		return this.pushColumn(new Column(name, "smallserial"))
	}

	smallInteger = (name: string): Column => {
		return this.pushColumn(new Column(name, "smallint"))
	}

	string = (name: string, length: number): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "varchar", length))
	}

	text = (name: string): Column => {
		return this.pushColumn(new Column(name, "text"))
	}

	time = (name: string, length: number = 0): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "time", length))
	}

	timeTz = (name: string, length: number = 0): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "timetz", length))
	}

	timestamp = (name: string, length: number = 0): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "timestamp", length))
	}

	timestampTz = (name: string, length: number = 0): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "timestamptz", length))
	}

	timestamps = (length: number = 0): void => {
		//TODO Add created_at, updated_at
		const column1 = new ColumnWithInput("created_at", "timestamp", length)
		const column2 = new ColumnWithInput("updated_at", "timestamp", length)

		this.columns.push(column1, column2)
	}

	timestampsTz = (length: number = 0): void => {
		//TODO Add created_at, updated_at
		const column1 = new ColumnWithInput("created_at", "timestamptz", length)
		const column2 = new ColumnWithInput("updated_at", "timestamptz", length)

		this.columns.push(column1, column2)
	}

	uuid = (name: string): Column => {
		return this.pushColumn(new Column(name, "uuid"))
	}
}

export default Table;
