import { ClientMySQL } from "../../../mod.ts";

export default {
  client: new ClientMySQL("./tests/cli", {
    "hostname": "localhost",
    "port": 5001,
    "username": "root",
    "db": "nessie",
  }),
};
