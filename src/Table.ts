import { Column, ColumnWithInput } from './Column.ts';

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
}

export class Table {
	protected tableName: string;
	protected columns: Column[];
	protected customColumns?: string[]
	protected constraints: TableConstraints = {
		unique: [],
		index: [],
		enums: [],
		updatedAt: false
	};

	constructor(name: string) {
		this.tableName = name
		this.columns = []
	}

	toSql = (): string => {
		let sql = ''

		this.constraints.enums.forEach(enumCol => {
			sql += `CREATE TYPE ${enumCol.name} AS ENUM (${enumCol.columns.join(', ')}); `
		})


		sql += this.tableName

		sql += " ("
			+ this.columns.map(el => el.toSql()).join(', ')
			+ (this.columns.length > 0 && this.customColumns ? ', ' : '')
			+ (this.customColumns ? `${this.customColumns?.join(', ')}` : '')
			+ ");"

		this.constraints.unique.forEach((el: string[]) => {
			let result = el.join(', ')

			sql += ` ALTER TABLE ${this.tableName} ADD UNIQUE(${result});`
		})

		sql += this.constraints.primary
			? ` ALTER TABLE ${this.tableName} ADD PRIMARY KEY (${this.constraints.primary.join(', ')});`
			: ''

		this.constraints.index.forEach(el => {
			sql += ` CREATE INDEX ON ${this.tableName} (${el});`
		})

		sql += this.constraints.updatedAt
			? ` DROP TRIGGER IF EXISTS set_timestamp on some_table; CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.${this.tableName} FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();`
			: ''

		return sql
	}

	private pushColumn = <T extends Column>(column: T): T => {
		this.columns.push(column)
		return column
	}

	custom = (string: string) => {
		if (!this.customColumns) {
			this.customColumns = [string]
		} else {
			this.customColumns.push(string)
		}
	}

	unique = (col: string | string[]) => {
		if (typeof col === "string") col = [col]
		this.constraints.unique
			? this.constraints.unique.push(col)
			: this.constraints.unique = [col]

		return this
	}

	primary = (...col: string[]) => {
		this.constraints.primary = col

		return this
	}

	index = (...col: string[]) => {
		this.constraints.index
			? this.constraints.index.push(...col)
			: this.constraints.index = col

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

	createdAt = () => {
		this.timestamp('created_at').default('now()')
	}

	createdAtTz = () => {
		this.timestampTz('created_at').default('now()')
	}

	date = (name: string): Column => {
		return this.pushColumn(new Column(name, "date"))
	}

	dateTime = (name: string, length: number = 0): ColumnWithInput => {
		return this.timestamp(name, length)
	}

	dateTimeTz = (name: string, length: number = 0): ColumnWithInput => {
		return this.timestampTz(name, length)
	}

	decimal = (name: string, before: number = 8, after: number = 2): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "decimal", before, after))
	}

	double = (name: string, before: number = 8, after: number = 2): ColumnWithInput => {
		return this.float(name, before, after)
	}

	enum = (name: string, array: string[], typeName: string = name): ColumnWithInput => {
		const newEnum: EnumColumn = { name: typeName, columns: array }
		if (!this.constraints.enums) {
			this.constraints.enums = [newEnum]
		}
		this.constraints.enums?.push(newEnum)

		return this.pushColumn(new ColumnWithInput(name, typeName, array))
	}

	float = (name: string, before: number = 8, after: number = 2): ColumnWithInput => {
		return this.pushColumn(new ColumnWithInput(name, "float8", before, after))
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

	macAddress = (name: string, isMacAddress8: boolean = false): Column => {
		return this.pushColumn(new Column(name, `macaddr${isMacAddress8 ? '8' : ''}`))
	}

	macAddress8 = (name: string): Column => {
		return this.macAddress(name, true)
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

	timestamps = (): void => {
		this.createdAt()
		this.updatedAt()
	}

	timestampsTz = (): void => {
		this.createdAtTz()
		this.updatedAtTz()
	}

	updatedAt = () => {
		this.timestamp('updated_at').default('now()')
		this.constraints.updatedAt = true
	}

	updatedAtTz = () => {
		this.timestampTz('updated_at').default('now()')
		this.constraints.updatedAt = true
	}

	uuid = (name: string): Column => {
		return this.pushColumn(new Column(name, "uuid"))
	}
}

export default Table;
