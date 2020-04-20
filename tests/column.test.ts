import { Column, ColumnWithInput } from "../mod.ts";
import { assertEquals } from "https://deno.land/std@v0.34.0/testing/asserts.ts";

const strings = [
	{
		name: "Standard Column",
		string: new Column('testName', 'testType')
			.toSql(),
		solution: "testName testType",
	}, {
		name: "Column with default",
		string: new Column('testName', 'testType')
			.default('testDefault')
			.toSql(),
		solution: "testName testType default testDefault",
	}, {
		name: "Column with nullable",
		string: new Column('testName', 'testType')
			.nullable()
			.toSql(),
		solution: "testName testType not null",
	}, {
		name: "Column with default and nullable",
		string: new Column('testName', 'testType')
			.default('testDefault')
			.nullable()
			.toSql(),
		solution: "testName testType default testDefault not null",
	}, {
		name: "ColumnWithInput 1 input",
		string: new ColumnWithInput('testName', 'testType', 1)
			.default('testDefault')
			.nullable()
			.toSql(),
		solution: "testName testType (1) default testDefault not null",
	}, {
		name: "ColumnWithInput 2 input",
		string: new ColumnWithInput('testName', 'testType', 1, 2)
			.default('testDefault')
			.nullable()
			.toSql(),
		solution: "testName testType (1, 2) default testDefault not null",
	}, {
		name: "Column with default and nullable",
		string: new ColumnWithInput('testName', 'testType', ['one', 'two', 'three'])
			.default('testDefault')
			.nullable()
			.toSql(),
		solution: "testName testType (one,two,three) default testDefault not null",
	},
];

strings.forEach(({ name, string, solution }) =>
	Deno.test({
		name: name || "Empty",
		fn(): void {
			assertEquals(string, solution);
		},
	})
);
