import Denomander from "https://deno.land/x/denomander/mod.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";
import { Schema } from './mod.ts';

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

program.option("-p --path", "Path to migration folder")
	.option("-c --connection", "DB connection url, e.g. postgres://root:pwd@localhost:5000/nessie")
	.command("make [migrationName]", "Creates a migration file with the name")
	.command("migrate", "Migrates one migration")
	.command("rollback", "Rolls back one migration");

program.parse(Deno.args);

const path: string = !program.path
	? `${Deno.cwd()}/migrations`
	: program.path?.startsWith("/")
		? program.path
		: program.path.startsWith("./")
			? `${Deno.cwd()}/${program.path.substring(2)}`
			: `${Deno.cwd()}/${program.path}`;

if (program.make) {
	await Deno.mkdir(path, { recursive: true });

	await Deno.copyFile(
		"./src/templates/migration.ts",
		`${path}/${Date.now()}-${program.make}.ts`,
	);
}

const createMigrationTable = async (client: Client): Promise<void> => {
	const hasTableString = Schema.hasTable(TABLE_NAME_MIGRATIONS)
	// const hasTableString = Schema.hasTable('tablename')

	const hasMigrationTable = await client.query(hasTableString)

	if (hasMigrationTable.rows[0][0] !== TABLE_NAME_MIGRATIONS) {
		const schema = new Schema()

		let sql = schema.create(TABLE_NAME_MIGRATIONS, (table) => {
			table.id()
			table.string('file_name', 100)
			table.timestamp(COL_CREATED_AT)

			table.unique('file_name')
		})

		sql += `CREATE OR REPLACE FUNCTION trigger_set_timestamp()
		RETURNS TRIGGER AS $$
		BEGIN
		  NEW.updated_at = NOW();
		  RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;`

		//TODO Add soft delete
		// sql += ` CREATE OR REPLACE FUNCTION soft_delete() RETURNS VOID AS $$ 
		// BEGIN 
		// RAISE EXCEPTION 'only soft deletes allowed'; 
		// END; 
		// CREATE OR REPLACE RULE prevent_account_deletion AS ON DELETE 
		// TO account 
		// DO INSTEAD SELECT enforce_soft_delete();`

		await client.query(sql)
	}
}

const filterMigrations = (file: Deno.DirEntry, time: number): boolean => {

	const fileTime = parseInt(file.name.split('-')[0])

	if (fileTime < time) return false

	return true
}

const migrate = async () => {
	const files = Array.from(Deno.readdirSync(path));

	const client = new Client(program.connection);
	await client.connect();

	await createMigrationTable(client)

	const result = await client.query(`select ${COL_FILE_NAME} from ${TABLE_NAME_MIGRATIONS} order by ${COL_CREATED_AT} desc limit 1`)

	files
		.filter((file: Deno.DirEntry): boolean => {
			if (result.rows[0] === undefined) return true

			return parseInt(file.name.split('-')[0]) > new Date(result.rows[0][0]).getTime()
		})
		.sort((a, b) => parseInt(b?.name ?? "0") - parseInt(a?.name ?? "0"));

	if (files.length > 0) {
		files.forEach(async file => {
			let { up } = await import(`${path}/${file.name}`);

			const schema = new Schema()

			await up(schema);

			let query = schema.query

			query += `INSERT INTO ${TABLE_NAME_MIGRATIONS} (${COL_FILE_NAME}, ${COL_CREATED_AT}) VALUES ('${file.name}',now())`

			await client.query(query);

			await client.end()
		})

	}
}

if (program.migrate) {
	if (!program.connection) throw new Error('Required option [connection] not specified')
	migrate()
}

const rollback = async () => {
	const client = new Client(program.connection);
	await client.connect();

	const result = await client.query(`select ${COL_FILE_NAME} from ${TABLE_NAME_MIGRATIONS} order by ${COL_CREATED_AT} desc limit 1`)

	if (result.rows[0] === undefined || result.rows[0][0] === undefined) {
		console.log('Nothing to rollback')

	} else {
		const fileName = result.rows[0][0]
		let { down } = await import(`${path}/${fileName}`);

		const schema = new Schema()

		await down(schema);

		let query = schema.query

		query += ` DELETE FROM ${TABLE_NAME_MIGRATIONS} WHERE ${COL_FILE_NAME} = '${fileName}';`

		await client.query(query);

		await client.end()
	}
}

if (program.rollback) {
	if (!program.connection) throw new Error('Required option [connection] not specified')
	rollback()
}


