import Denomander from "https://deno.land/x/denomander/mod.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";
import { Schema } from './mod.ts';
import { QueryResult } from "https://deno.land/x/postgres/query.ts";
const TABLE_NAME_MIGRATIONS = 'nessie_migrations';
const COL_FILE_NAME = 'file_name';
const COL_CREATED_AT = 'created_at';


const program = new Denomander(
	{
		app_name: "Migrating Denosaurs",
		app_description:
			"A micro database migration tool for deno. Currently only support for PostgreSQL",
		app_version: "0.0.1",
	},
);

const outputDebug = (output: any, title?: string) => {
	if (program.debug) {
		title ? console.log(title + ': ') : null
		console.log(output)
	}
}

program
	.option("-d --debug", "Enables verbose output")
	.option("-p --path", "Path to migration folder")
	.option("-c --connection", "DB connection url, e.g. postgres://root:pwd@localhost:5000/nessie")
	.command("make [migrationName]", "Creates a migration file with the name")
	.command("migrate", "Migrates one migration")
	.command("rollback", "Rolls back one migration");

program.parse(Deno.args);

outputDebug(program, 'Config')

const path: string = !program.path
	? `${Deno.cwd()}/migrations`
	: program.path?.startsWith("/")
		? program.path
		: program.path.startsWith("./")
			? `${Deno.cwd()}/${program.path.substring(2)}`
			: `${Deno.cwd()}/${program.path}`;

outputDebug(path, 'Path')

const queryHandler = async (client: Client, query: string) => {
	const queries = query.trim().split(';')

	if (queries[queries.length - 1] === "") queries.pop()

	if (queries.length === 1) return await client.query(query)

	const results: QueryResult[] = []

	for (const el of queries) {
		outputDebug(el, 'Query')

		const result = await client.query(el + ';')

		results.push(result)
	}

	outputDebug(results, 'Query result')

	return results
}

const makeMigration = async () => {
	await Deno.mkdir(path, { recursive: true });

	const fileName = `${Date.now()}-${program.make}.ts`

	outputDebug(program, 'Config')

	await Deno.copyFile(
		"./src/templates/migration.ts",
		`${path}/${fileName}`,
	);

	console.info(`Created migration ${fileName} at ${path}`)
}

const createMigrationTable = async (client: Client) => {
	const hasTableString = Schema.hasTable(TABLE_NAME_MIGRATIONS)

	const hasMigrationTable = await client.query(hasTableString)

	outputDebug(hasMigrationTable, 'Has migration table')

	const migrationTableExists = hasMigrationTable.rows[0][0] !== TABLE_NAME_MIGRATIONS

	outputDebug(migrationTableExists, 'Migration table exsists')

	if (migrationTableExists) {
		const schema = new Schema()

		let sql = schema.create(TABLE_NAME_MIGRATIONS, (table) => {
			table.id()
			table.string('file_name', 100)
			table.timestamp(COL_CREATED_AT)

			table.unique('file_name')
		})

		sql += 'CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$BEGIN NEW.updated_at = NOW();RETURN NEW;END;$$ LANGUAGE plpgsql;'

		//TODO Add soft delete
		// sql += ` CREATE OR REPLACE FUNCTION soft_delete() RETURNS VOID AS $$ 
		// BEGIN 
		// RAISE EXCEPTION 'only soft deletes allowed'; 
		// END; 
		// CREATE OR REPLACE RULE prevent_account_deletion AS ON DELETE 
		// TO account 
		// DO INSTEAD SELECT enforce_soft_delete();`

		const result = await queryHandler(client, sql)

		console.info('Created migration table')

		outputDebug(result, 'Migration table creation')
	}
}

const migrate = async (client: Client) => {
	const files = Array.from(Deno.readdirSync(path));

	outputDebug(files, 'Files in migration folder')

	await createMigrationTable(client)

	const result = await client.query(`select ${COL_FILE_NAME} from ${TABLE_NAME_MIGRATIONS} order by ${COL_CREATED_AT} desc limit 1`)

	outputDebug(result, 'Latest migration')

	files
		.filter((file: Deno.DirEntry): boolean => {
			if (result.rows[0] === undefined) return true

			return parseInt(file.name.split('-')[0]) > new Date(result.rows[0][0]).getTime()
		})
		.sort((a, b) => parseInt(b?.name ?? "0") - parseInt(a?.name ?? "0"));

	outputDebug(files, 'Files after filter and sort')

	if (files.length > 0) {
		for (const file of files) {
			let { up } = await import(`${path}/${file.name}`);

			const schema = new Schema()

			await up(schema);

			let query = schema.query

			query += `INSERT INTO ${TABLE_NAME_MIGRATIONS} (${COL_FILE_NAME}, ${COL_CREATED_AT}) VALUES ('${file.name}', now());`

			outputDebug(query, 'Migration query')

			const result = await queryHandler(client, query);

			console.info(`Migrated ${file.name}`)

			outputDebug(result, 'Migration table creation')
		}

		console.info('Migration complete')

	} else {
		console.info('Nothing to migrate')
	}
}

const rollback = async (client: Client) => {
	const result = await client.query(`select ${COL_FILE_NAME} from ${TABLE_NAME_MIGRATIONS} order by ${COL_CREATED_AT} desc limit 1`)

	outputDebug(result, 'Latest migration')

	if (result.rows[0] === undefined || result.rows[0][0] === undefined) {
		console.info('Nothing to rollback')

	} else {
		const fileName = result.rows[0][0]
		let { down } = await import(`${path}/${fileName}`);

		const schema = new Schema()

		await down(schema);

		let query = schema.query

		outputDebug(query, 'Rollback query')

		query += ` DELETE FROM ${TABLE_NAME_MIGRATIONS} WHERE ${COL_FILE_NAME} = '${fileName}';`

		await queryHandler(client, query);

		console.info(`Rolled back ${fileName}`)
	}
}

const run = async () => {
	try {
		if (program.make) {
			await makeMigration()

		} else {
			const client = new Client(program.connection);
			await client.connect();

			if (program.migrate) {
				if (!program.connection) throw new Error('Required option [connection] not specified')
				await migrate(client)

			} else if (program.rollback) {
				if (!program.connection) throw new Error('Required option [connection] not specified')
				await rollback(client)
			}

			await client.end()
		}

	} catch (e) {
		console.error(e)
	}
}

run()