import type { Migration } from "../mod.ts";

/**
 * The context has the dialect of the database, for SQL which differs between
 * databases, and the client has the standard `@stdext/database` interface.
 */
export default {
  // MySQL commits DDL statements implicitly, so they can not be rolled back.
  // Set `transaction: false` for statements which can not run in a transaction.
  transaction: true,

  async up({ client, dialect }) {
    const id = dialect.name === "postgres"
      ? "bigserial PRIMARY KEY"
      : dialect.name === "mysql"
      ? "bigint AUTO_INCREMENT PRIMARY KEY"
      : "integer PRIMARY KEY AUTOINCREMENT";
    await client.execute(
      `CREATE TABLE ${
        dialect.quoteIdentifier("posts")
      } (id ${id}, title VARCHAR(200))`,
    );
    // Parameters use the placeholders of the dialect
    await client.execute(
      `INSERT INTO posts (title) VALUES (${dialect.placeholder(0)})`,
      ["Hello"],
    );
  },

  async down({ client }) {
    await client.execute("DROP TABLE posts");
  },
} satisfies Migration;
