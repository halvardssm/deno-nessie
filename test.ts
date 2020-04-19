import { Column } from "./mod.ts";

const table = new Table({
	name: "test_table",
	columns: [
		{
			name: "col1",
			type: "SERIAL",
			length: 2,
			default: "3",
			nullable: false,
			comment: "some col",
		},
	],
});
