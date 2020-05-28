export const up = (): string => {
  return "CREATE TABLE testTable2 (id int, created_at datetime);"
};

export const down = (): string => {
  return "DROP TABLE testTable2"
};