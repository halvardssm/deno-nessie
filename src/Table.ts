import { Column, ColumnReference, CreateColumnI } from "./Column.ts";
import { bracket } from "./utils.ts";

export interface CreateTableI {
  name: string;
  ifNotExists?: boolean;
  columns?: CreateColumnI[];
}

export class Constraints {
}

export class Table {
  query: string[] = [];
  script: string = "";
  name: string;
  ifNotExists: boolean = false;
  columns: Column[] = [];
  constraints: Constraints[] = [];

  constructor(config: CreateTableI) {
    this.name = config.name;
    if (config.columns) {
      this.setColumns(config.columns);
    }
    this.build();

    this.script = this.query.join(" ");
  }

  build = (): void => {
    this.query.push("CREATE TABLE");

    if (this.ifNotExists) {
      this.query.push("IF NOT EXISTS");
    }

    this.query.push(this.name);

    this.query.push(this.getColumns());

    this.query.push(this.getComments());

    this.query.push(this.getConstraints());
  };

  getConstraints = (): string => {
    return "";
  };

  getComments = (): string => {
    const comments: string[] = [];

    this.columns.forEach((el) => {
      if (el.comment) {
        comments.push(el.comment(this.name));
      }
    });

    return comments.join("; ") + ";";
  };

  getColumns = (): string => {
    const cols: string[] = [];
    this.columns.forEach((el) => cols.push(el.script));
    return bracket(cols.join(", ")) + ";";
  };

  setColumns = (conf: CreateColumnI[]): void =>
    conf.forEach((el) => this.columns.push(new Column(el)));
}

export default { Table };
