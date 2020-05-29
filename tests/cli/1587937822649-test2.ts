export const up = (): string => {
  return "CREATE TABLE testTable2 (id int);";
};

export const down = (): string => {
  return "DROP TABLE testTable2";
};
