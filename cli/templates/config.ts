const configPg = {
  migrationFolder: `./migrations`,
  connection: {
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
  },
  dialect: "pg",
};

const configMySql = {
  migrationFolder: `./migrations`,
  connection: {
    hostname: "localhost",
    port: 3306,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
  },
  dialect: "mysql",
};

const configSqLite = {
  migrationFolder: `./migrations`,
  connection: "sqlite.db",
  dialect: "sqlite",
};

export default configPg;
