import { assertEquals, assertRejects } from "@std/assert";
import {
  ConnectionError,
  QueryError,
  sql as tag,
  TransactionError,
} from "@stdext/database/sql";
import {
  testClient,
  testDriver,
  type TestSql,
} from "@stdext/database/sql/testing";
import { PostgresClient, PostgresDriver } from "../postgres.ts";

const URL = Deno.env.get("NESSIE_TEST_POSTGRES") ??
  "postgres://root:pwd@localhost:5100/nessie";

const sql: TestSql = {
  execute: "CREATE TABLE IF NOT EXISTS pg_conformance (id INTEGER, name TEXT)",
  query:
    "SELECT 1 AS id, 'Alice' AS name UNION ALL SELECT 2, 'Bob' UNION ALL SELECT 3, 'Charlie'",
  columns: ["id", "name"],
  count: 3,
  parameterQuery: "SELECT $1::text AS value",
  emptyQuery: "SELECT 1 AS id, 'Alice' AS name WHERE false",
  parameterTemplate: (value) => tag`SELECT ${value}::text AS value`,
};

async function reset() {
  await using client = new PostgresClient(URL);
  await client.execute("DROP TABLE IF EXISTS pg_conformance");
}

Deno.test("PostgresDriver conformance", async (t) => {
  await reset();
  await testDriver(t, new PostgresDriver(), URL, sql);
  await reset();
});

Deno.test("PostgresClient conformance", async (t) => {
  await reset();
  await testClient(t, (options) => new PostgresClient(URL, options), sql);
  await reset();
});

Deno.test("PostgresDriver", async (t) => {
  await t.step("has the Postgres dialect", () => {
    const { dialect } = new PostgresDriver();
    assertEquals(dialect.name, "postgres");
    assertEquals(dialect.placeholder(0), "$1");
    assertEquals(dialect.placeholder(2), "$3");
    assertEquals(dialect.quoteIdentifier('a"b'), '"a""b"');
  });

  await t.step("rejects multiple statements", async () => {
    await using connection = await new PostgresDriver().connect(URL);
    const statements = "SELECT 1; SELECT 2";
    await assertRejects(() => connection.execute(statements), QueryError);
    await assertRejects(() => connection.query(statements), QueryError);
    await connection.executeScript(statements);
  });

  await t.step(
    "reports affected rows only for modifying statements",
    async () => {
      await using connection = await new PostgresDriver().connect(URL);
      await connection.executeScript(
        "CREATE TEMP TABLE t (id serial PRIMARY KEY, a int)",
      );
      assertEquals(
        await connection.execute("INSERT INTO t (a) VALUES (1), (2), (3)"),
        { affectedRows: 3 },
      );
      assertEquals(await connection.execute("SELECT a FROM t"), {
        affectedRows: 0,
      });
      assertEquals(
        await connection.execute("UPDATE t SET a = 9 WHERE a > $1", [1]),
        { affectedRows: 2 },
      );
      assertEquals(await connection.execute("DELETE FROM t WHERE a = 0"), {
        affectedRows: 0,
      });
    },
  );

  await t.step("binds and reads values", async () => {
    await using connection = await new PostgresDriver().connect(URL);
    await using rows = await connection.query(
      "SELECT $1::int AS i, $2::text AS s, $3::bytea AS b, $4::bigint AS big, $5::bool AS flag, $6::text AS n",
      [1, "s", new Uint8Array([1, 2]), 2n ** 62n, true, undefined],
    );
    const [row] = await Array.fromAsync(rows);
    assertEquals(row[0], 1);
    assertEquals(row[1], "s");
    assertEquals(new Uint8Array(row[2] as Uint8Array), new Uint8Array([1, 2]));
    assertEquals(row[3], 2n ** 62n);
    assertEquals(row[4], true);
    assertEquals(row[5], null);
  });

  await t.step("rejects named parameters", async () => {
    await using connection = await new PostgresDriver().connect(URL);
    await assertRejects(
      () => connection.query("SELECT $1", { a: 1 }),
      QueryError,
      "named parameters",
    );
  });

  await t.step("streams rows in batches and frees the connection", async () => {
    await using connection = await new PostgresDriver().connect(URL, {
      batchSize: 10,
    });
    const rows = await connection.query(
      "SELECT g FROM generate_series(1, 1000) g",
    );
    let count = 0;
    for await (const _ of rows) if (++count === 25) break;
    assertEquals(count, 25);
    await rows[Symbol.asyncDispose]();
    assertEquals(
      (await Array.fromAsync(await connection.query("SELECT 1"))).length,
      1,
    );
  });

  await t.step("is busy while rows are being read", async () => {
    await using connection = await new PostgresDriver().connect(URL, {
      batchSize: 1,
    });
    await using _rows = await connection.query(
      "SELECT g FROM generate_series(1, 3) g",
    );
    await assertRejects(
      () => connection.execute("SELECT 1"),
      QueryError,
      "busy",
    );
  });

  await t.step("transaction options", async () => {
    await using connection = await new PostgresDriver().connect(URL);
    const tx = await connection.begin({
      isolationLevel: "serializable",
      readOnly: true,
    });
    await assertRejects(
      () => connection.execute("CREATE TEMP TABLE nope (a int)"),
      QueryError,
    );
    await tx.rollback();
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => connection.begin({ isolationLevel: "bogus" as any }),
      TransactionError,
    );
    const other = await connection.begin();
    await assertRejects(() => other.savepoint("a b"), TransactionError);
    await other.rollback();
  });

  await t.step("rejects connecting to an unavailable server", async () => {
    await assertRejects(
      () =>
        new PostgresDriver().connect("postgres://root:pwd@localhost:5999/x", {
          connectTimeout: 2000,
        }),
      ConnectionError,
    );
    await assertRejects(
      () => new PostgresDriver().connect(URL.replace("pwd", "wrong")),
      ConnectionError,
    );
  });
});
