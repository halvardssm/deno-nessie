import Schema from '../../query-builder/Schema.ts';

export const up = (): string => {
  return new Schema().create("test", (table) => {
    table.id();
    table.string("col_1", 10);
    table.timestamps();
  });
};

export const down = (): string => {
  return new Schema().drop("test");
};
