import { assert, assertEquals, assertRejects } from "@std/assert";
import {
  ConnectionError,
  QueryError,
  sql as tag,
  TransactionError,
} from "@stdx/database/sql";
import {
  testClient,
  testDriver,
  type TestSql,
} from "@stdx/database/sql/testing";
import { MysqlClient, MysqlDriver } from "../mysql.ts";

const URL = Deno.env.get("NESSIE_TEST_MYSQL") ??
  "mysql://root@localhost:5101/nessie";

const sql: TestSql = {
  // MySQL commits DDL implicitly, which would end the transactions of the suite
  execute: "DO 0",
  query:
    "SELECT 1 AS id, 'Alice' AS name UNION ALL SELECT 2, 'Bob' UNION ALL SELECT 3, 'Charlie'",
  columns: ["id", "name"],
  count: 3,
  parameterQuery: "SELECT ? AS value",
  emptyQuery: "SELECT 1 AS id, 'Alice' AS name FROM DUAL WHERE false",
  parameterTemplate: (value) => tag`SELECT ${value} AS value`,
};

Deno.test("MysqlDriver conformance", async (t) => {
  await testDriver(t, new MysqlDriver(), URL, sql);
});

Deno.test("MysqlClient conformance", async (t) => {
  await testClient(t, (options) => new MysqlClient(URL, options), sql);
});

Deno.test("MysqlDriver", async (t) => {
  await t.step("has the MySQL dialect", () => {
    const { dialect } = new MysqlDriver();
    assertEquals(dialect.name, "mysql");
    assertEquals(dialect.placeholder(3), "?");
    assertEquals(dialect.quoteIdentifier("a`b"), "`a``b`");
  });

  await t.step("reports affected rows and inserted ids", async () => {
    await using connection = await new MysqlDriver().connect(URL);
    await connection.executeScript(
      "CREATE TEMPORARY TABLE t (id INT AUTO_INCREMENT PRIMARY KEY, a INT)",
    );
    assertEquals(await connection.execute("INSERT INTO t (a) VALUES (1)"), {
      affectedRows: 1,
      lastInsertId: 1,
    });
    assertEquals(
      await connection.execute("INSERT INTO t (a) VALUES (?), (?)", [2, 3]),
      { affectedRows: 2, lastInsertId: 2 },
    );
    assertEquals(await connection.execute("SELECT a FROM t"), {
      affectedRows: 0,
    });
    assertEquals(
      await connection.execute("UPDATE t SET a = 9 WHERE a > ?", [1]),
      { affectedRows: 2 },
    );
  });

  await t.step("binds and reads values", async () => {
    await using connection = await new MysqlDriver().connect(URL);
    await using rows = await connection.query(
      "SELECT ? AS i, ? AS s, ? AS b, CAST(? AS SIGNED) AS big, ? AS flag, ? AS n",
      [1, "s", new Uint8Array([1, 2]), 2n ** 62n, true, undefined],
    );
    const [row] = await Array.fromAsync(rows);
    assertEquals(row[0], 1);
    assertEquals(row[1], "s");
    assertEquals(new Uint8Array(row[2] as Uint8Array), new Uint8Array([1, 2]));
    assertEquals(row[3], 2n ** 62n);
    assertEquals(row[4], 1);
    assertEquals(row[5], null);
  });

  await t.step("rejects named parameters", async () => {
    await using connection = await new MysqlDriver().connect(URL);
    await assertRejects(
      () => connection.query("SELECT ?", { a: 1 }),
      QueryError,
      "named parameters",
    );
  });

  await t.step("streams rows and frees the connection", async () => {
    await using connection = await new MysqlDriver().connect(URL, {
      batchSize: 10,
    });
    const query =
      `WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 900) SELECT x FROM c`;
    const rows = await connection.query(query);
    let count = 0;
    for await (const _ of rows) if (++count === 25) break;
    assertEquals(count, 25);
    await rows[Symbol.asyncDispose]();
    assertEquals(
      (await Array.fromAsync(await connection.query("SELECT 1"))).length,
      1,
    );
  });

  // About 125 million rows of 100 bytes, which are streamed from the server
  // while they are read. Receiving them all would take minutes, so the tests
  // only finish quickly when the query is cancelled.
  const HUGE =
    `WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 500) SELECT a.x, REPEAT('x', 100) AS pad FROM c a, c b, c d`;

  await t.step("cancels the query when rows are abandoned", async () => {
    await using connection = await new MysqlDriver().connect(URL, {
      batchSize: 1,
    });
    const started = performance.now();
    const rows = await connection.query(HUGE);
    let count = 0;
    for await (const _ of rows) if (++count === 3) break;
    // The connection is free again, and was not left running the old query
    assertEquals(
      await Array.fromAsync(await connection.query("SELECT 42 AS answer")),
      [[42]],
    );
    const elapsed = performance.now() - started;
    assert(elapsed < 8000, `Cancelling took ${Math.round(elapsed)}ms`);
  });

  await t.step("cancels the query when rows are disposed unread", async () => {
    await using connection = await new MysqlDriver().connect(URL, {
      batchSize: 1,
    });
    const started = performance.now();
    const rows = await connection.query(HUGE);
    await rows[Symbol.asyncDispose]();
    assertEquals(
      await Array.fromAsync(await connection.query("SELECT 1")),
      [[1]],
    );
    assert(performance.now() - started < 8000);
  });

  await t.step("closing while rows are being read does not wait", async () => {
    const connection = await new MysqlDriver().connect(URL, { batchSize: 1 });
    await connection.query(HUGE);
    const started = performance.now();
    await connection.close();
    assert(connection.closed);
    assert(performance.now() - started < 2000);
  });

  await t.step("is busy while rows are being read", async () => {
    await using connection = await new MysqlDriver().connect(URL, {
      batchSize: 1,
    });
    await using _rows = await connection.query(
      `WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 900) SELECT x FROM c`,
    );
    await assertRejects(
      () => connection.execute("SELECT 1"),
      QueryError,
      "busy",
    );
  });

  await t.step("transaction options", async () => {
    await using connection = await new MysqlDriver().connect(URL);
    // DDL commits implicitly, even in a read only transaction, so use DML
    await connection.executeScript(
      "CREATE TABLE IF NOT EXISTS my_read_only (a INT)",
    );
    try {
      const tx = await connection.begin({
        isolationLevel: "serializable",
        readOnly: true,
      });
      await assertRejects(
        () => connection.execute("INSERT INTO my_read_only VALUES (1)"),
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
    } finally {
      await connection.executeScript("DROP TABLE IF EXISTS my_read_only");
    }
  });

  await t.step("rejects connecting to an unavailable server", async () => {
    await assertRejects(
      () =>
        new MysqlDriver().connect("mysql://root@localhost:5999/x", {
          connectTimeout: 2000,
        }),
      ConnectionError,
    );
    await assertRejects(
      () =>
        new MysqlDriver().connect("mysql://root:wrong@localhost:5101/nessie"),
      ConnectionError,
    );
  });
});
