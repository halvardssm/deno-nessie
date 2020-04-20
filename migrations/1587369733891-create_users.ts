import { Schema } from "../mod.ts";

export const up = (scema: Schema): void => {
	scema.create('some_table', table => {
		table.id()
		table.string('name', 100).nullable()
		table.boolean('isTrue').default('false')
		table.custom('custom_column int default 1')
		table.timestamps()
	})
};

export const down = (schema: Schema): void => {
	schema.drop('some_table')
};