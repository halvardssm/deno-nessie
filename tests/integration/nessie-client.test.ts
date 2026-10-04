import { assertEquals } from "@std/assert";
import type { NessieClient } from "../../lib/types.ts";
import { MysqlClient } from "../../clients/mysql.ts";
import { PostgresClient } from "../../clients/postgres.ts";
import { SqliteClient } from "../../clients/sqlite.ts";

const databases: Record<string, () => NessieClient> = {
  sqlite: () => new SqliteClient(":memory:"),
  postgres: () =>
    new PostgresClient(
      Deno.env.get("NESSIE_TEST_POSTGRES") ??
        "postgres://root:pwd@localhost:5100/nessie",
    ),
  mysql: () =>
    new MysqlClient(
      Deno.env.get("NESSIE_TEST_MYSQL") ?? "mysql://root@localhost:5101/nessie",
    ),
};

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

for (const [name, create] of Object.entries(databases)) {
  Deno.test(`NessieClient interface on ${name}`, async (t) => {
    const client = create();
    // One connection for everything, like the migration client does
    await using connection = await client.acquire();
    await connection.executeScript("DROP TABLE IF EXISTS nessie_migrations");
    try {
      await t.step("creates the table, repeatedly", async () => {
        await client.createMigrationTable(connection);
        await client.createMigrationTable(connection);
        assertEquals(await client.getAppliedMigrations(connection), []);
      });

      await t.step("adds, orders, updates and removes migrations", async () => {
        await client.addMigration(connection, "20240101000000_a.ts", HASH_A);
        await client.addMigration(connection, "20240102000000_b.ts", HASH_B);
        assertEquals(await client.getAppliedMigrations(connection), [
          { name: "20240102000000_b.ts", checksum: HASH_B },
          { name: "20240101000000_a.ts", checksum: HASH_A },
        ]);

        await client.setChecksum(connection, "20240101000000_a.ts", HASH_B);
        await client.removeMigration(connection, "20240102000000_b.ts");
        assertEquals(await client.getAppliedMigrations(connection), [
          { name: "20240101000000_a.ts", checksum: HASH_B },
        ]);
      });

      await t.step("adds the checksum column to an older table", async () => {
        await connection.execute(
          "ALTER TABLE nessie_migrations DROP COLUMN checksum",
        );
        await client.createMigrationTable(connection);
        // The existing rows are kept, without a checksum
        assertEquals(await client.getAppliedMigrations(connection), [
          { name: "20240101000000_a.ts", checksum: null },
        ]);
        await client.setChecksum(connection, "20240101000000_a.ts", HASH_A);
        assertEquals(
          (await client.getAppliedMigrations(connection))[0].checksum,
          HASH_A,
        );
      });

      await t.step("is part of the transaction it is called in", async () => {
        const tx = await connection.beginTransaction();
        await client.addMigration(tx, "20240103000000_c.ts", HASH_A);
        await tx.rollback();
        assertEquals(
          (await client.getAppliedMigrations(connection)).map((m) => m.name),
          ["20240101000000_a.ts"],
        );
      });
    } finally {
      await connection.executeScript("DROP TABLE IF EXISTS nessie_migrations");
    }
  });
}
