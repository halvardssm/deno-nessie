import type { Migration } from "../mod.ts";

/** A migration is the default export of a file named `<yyyyMMddHHmmss>_<name>.ts` */
export default {
  async up({ client }) {
    await client.execute(
      "CREATE TABLE users (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL)",
    );
  },

  async down({ client }) {
    await client.execute("DROP TABLE users");
  },
} satisfies Migration;
