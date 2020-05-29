import { ClientMySQL } from "../../../mod.ts";

export default {
  client: new ClientMySQL("./tests/migrations", {
    "hostname": "localhost",
    "port": 5001,
    "username": "root",
    "db": "nessie",
  }),
};
