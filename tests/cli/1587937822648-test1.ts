export const up = (): string => {
  return "CREATE TABLE testTable1 (id int);";
};

export const down = (): string => {
  return "DROP TABLE testTable1";
};
