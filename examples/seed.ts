import type { Seed } from "../mod.ts";

/** A seed is the default export of a file in a seed folder */
export default {
  async run({ client }) {
    await client.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");
  },
} satisfies Seed;
