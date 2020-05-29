export const up = (): string => {
  return "CREATE TABLE testTable3 (id int);";
};

export const down = (): string => {
  return "DROP TABLE testTable3";
};
