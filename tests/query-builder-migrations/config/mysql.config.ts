import { ClientMySQL } from "../../../mod.ts";

export default {
  client: new ClientMySQL("./tests/query-builder-migrations", {
    "hostname": "localhost",
    "port": 5001,
    "username": "root",
    "db": "nessie",
  })
};

