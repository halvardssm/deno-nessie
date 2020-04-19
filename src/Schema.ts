import { Table } from './Table.ts'

export class Schema {
	query: string = '';

	create = (name: string, createfn: (table: Table) => void): string => {
		const table = new Table(name)

		createfn(table)

		const sql = `CREATE TABLE ${table.toSql()}`;

		this.query += sql

		return sql
	}

	drop = (name: string | string[], ifExists: boolean = false, cascade: boolean = false) => {
		if (typeof name === "string") name = [name]

		const sql = `DROP TABLE${ifExists ? ' IF EXISTS' : ''} ${name.join(', ')}${cascade ? ' CASCADE' : ''};`

		this.query += sql

		return sql
	}

	// TODO Add Has table
	static hasTable = (name: string) => {
		return `SELECT to_regclass('${name}');`
	}
}

export default Schema