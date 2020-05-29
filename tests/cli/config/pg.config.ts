import { ClientPostgreSQL } from "../../../mod.ts";

export default {
  client: new ClientPostgreSQL("./tests/migrations", {
    "database": "nessie",
    "hostname": "localhost",
    "port": 5000,
    "user": "root",
    "password": "pwd",
  })
};

