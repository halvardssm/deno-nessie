import {
  COL_CREATED_AT,
  COL_FILE_NAME,
  MAX_FILE_NAME_LENGTH,
  TABLE_MIGRATIONS,
} from "../consts.ts";
import { ClientMySQL } from "./ClientMySQL.ts";

/** MySQL 5.5 client */
export class ClientMySQL55 extends ClientMySQL {
  protected get QUERY_CREATE_MIGRATION_TABLE() {
    return `CREATE TABLE ${TABLE_MIGRATIONS} (id bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${COL_FILE_NAME} varchar(${MAX_FILE_NAME_LENGTH}) NOT NULL UNIQUE, ${COL_CREATED_AT} timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP);`;
  }
}
