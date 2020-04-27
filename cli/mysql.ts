import {
	ClientI,
	traverseAndMigrateFiles,
	traverseAndRollbackFiles,
	QUERY_GET_LATEST,
	filterAndSortFiles,
	TABLE_MIGRATIONS,
	queryHandler,
	COL_FILE_NAME,
} from "./utils.ts";
import { State } from "./state.ts";
import { Client } from "https://deno.land/x/mysql/src/client.ts";
import Schema from "../src/Schema.ts";

export class MySQL implements ClientI {
	private state: State;
	private client: Client;

	constructor(state: State, client: Client) {
		this.state = state;
		this.client = client;
	}

	async migrate() {
		let files = Array.from(Deno.readdirSync(this.state.migrationFolder));

		this.state.debug(files, "Files in migration folder");

		await this._setupDatabase();

		const result = await this.client.query(QUERY_GET_LATEST);

		this.state.debug(result, "Latest migration");

		files = filterAndSortFiles(files, result.rows);

		this.state.debug(files, "Files after filter and sort");

		await traverseAndMigrateFiles(
			this.state,
			files,
			async (query) => await this.client.query(query),
		);
	}

	async rollback() {
		const result = await this.client.query(QUERY_GET_LATEST);

		this.state.debug(result, "Latest migration");

		await traverseAndRollbackFiles(
			this.state,
			result[0][COL_FILE_NAME],
			async (query) =>
				await queryHandler(
					query,
					this.state,
					async (query) => await this.client.query(query),
				),
		);
	}

	async close() {
		await this.client.close();
	}

	private async _setupDatabase() {
		const hasTableString = new Schema(this.state.dialect)
			.hasTable(TABLE_MIGRATIONS);
		this.state.debug(hasTableString, "Has migration table result");

		const hasMigrationTable = await this.client.query(hasTableString);

		this.state.debug(hasMigrationTable, "Has migration table result");

		const migrationTableExists = hasMigrationTable.rows?.[0] !== null;

		this.state.debug(migrationTableExists, "Migration table exsists");

		if (!migrationTableExists) {
			const schema = new Schema(this.state.dialect);

			let sql = schema.create(TABLE_MIGRATIONS, (table) => {
				table.id();
				table.string("file_name", 100);
				table.createdAt();

				table.unique("file_name");
			});

			await queryHandler(
				sql,
				this.state,
				async (query) => await this.client.query(query),
			);

			console.info("Database setup complete");
		}
	}
}
