const configPg = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: {
    database: "nessie",
    hostname: "localhost",
    port: 5000,
    user: "root",
    password: "pwd",
  },
  dialect: "pg",
};

const configMySql = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: {
    hostname: "localhost",
    port: 5001,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
  },
  dialect: "mysql",
};

const configSqLite = {
  migrationFolder: `${Deno.cwd()}/migrations`,
  connection: "sqlite.db",
  dialect: "sqlite",
};

export default configPg;
