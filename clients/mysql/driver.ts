import mysql from "mysql2/promise";
import type { Connection as RawConnection } from "mysql2";
import type { Readable } from "node:stream";
import {
  ConnectionError,
  type ConnectionOptions,
  DatabaseError,
  type Dialect,
  type Driver,
  type DriverConnection,
  type DriverQueryOptions,
  type DriverRows,
  type DriverSavepoint,
  type DriverStatement,
  type DriverTransaction,
  type ExecuteResult,
  QueryError,
  type QueryParameters,
  TransactionError,
  type TransactionOptions,
} from "@stdext/database/sql";

/** Options used when connecting to MySQL */
export interface MysqlConnectionOptions extends ConnectionOptions {
  /** The number of rows buffered when reading rows. Defaults to `100`. */
  batchSize?: number;
  /**
   * Options passed to {@link https://sidorares.github.io/node-mysql2 | mysql2}
   * as is, e.g. `ssl` or `authPlugins`. They take precedence over the other
   * options and the URL.
   */
  driverOptions?: Omit<mysql.ConnectionOptions, "uri">;
}

/** The options of a MySQL transaction */
export interface MysqlTransactionOptions extends TransactionOptions {
  /** The isolation level of the transaction */
  isolationLevel?:
    | "read uncommitted"
    | "read committed"
    | "repeatable read"
    | "serializable";
  /** Whether the transaction is read only */
  readOnly?: boolean;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ISOLATION_LEVELS = new Set([
  "read uncommitted",
  "read committed",
  "repeatable read",
  "serializable",
]);
const CONNECTION_CODES =
  /^(ECONN|ENOTFOUND|ETIMEDOUT|EPIPE|PROTOCOL_|ER_ACCESS_DENIED|ER_BAD_DB|ER_DBACCESS|ER_HOST|ER_CON_COUNT|ER_SERVER_SHUTDOWN|CONNECTION_)/;

type Header = { affectedRows: number; insertId: number | string };
type Fields = { name: string; columnType?: number }[] | undefined;
/** The column type of `BIGINT` */
const LONGLONG = 8;

function toMysqlValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  return value;
}

function toMysqlParams(params: QueryParameters | undefined): unknown[] {
  if (params === undefined) return [];
  if (!Array.isArray(params)) {
    throw new QueryError(
      "MySQL does not support named parameters, use ? placeholders with an array",
    );
  }
  return params.map(toMysqlValue);
}

/** Report errors of `mysql2` as spec errors */
function wrapError(
  error: unknown,
  ErrorClass: new (message: string) => DatabaseError = QueryError,
): DatabaseError {
  if (error instanceof DatabaseError) return error;
  const first = error instanceof AggregateError ? error.errors[0] : error;
  const code = (first as { code?: string } | undefined)?.code ?? "";
  const message = first instanceof Error
    ? first.message || String(code)
    : String(first);
  const wrapped = new (
    ErrorClass === QueryError && CONNECTION_CODES.test(code)
      ? ConnectionError
      : ErrorClass
  )(message);
  wrapped.cause = error;
  return wrapped;
}

function toExecuteResult(result: unknown): ExecuteResult {
  // With multiple statements, there is one result per statement.
  const header = (Array.isArray(result) ? result : [result]).find(
    (entry): entry is Header =>
      entry !== null && typeof entry === "object" && !Array.isArray(entry) &&
      "affectedRows" in entry,
  );
  if (!header) return { affectedRows: 0 };
  const insertId = header.insertId;
  return {
    affectedRows: header.affectedRows,
    ...(insertId && insertId !== "0" ? { lastInsertId: insertId } : {}),
  };
}

/** Converts the unsafe `BIGINT` strings of a row to `bigint` */
function toRow(row: unknown[], bigints: number[]): unknown[] {
  for (const index of bigints) {
    const value = row[index];
    if (typeof value === "string") row[index] = BigInt(value);
  }
  return row;
}

function bigintColumns(fields: Fields): number[] {
  return (fields ?? []).flatMap((field, index) =>
    field.columnType === LONGLONG ? [index] : []
  );
}

function abortable<T>(
  promise: PromiseLike<T>,
  signal: AbortSignal | undefined,
): Promise<T> {
  if (!signal) return Promise.resolve(promise);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() =>
      signal.removeEventListener("abort", onAbort)
    );
  });
}

/**
 * The SQL dialect of MySQL: `?` placeholders and backtick quoted identifiers.
 */
export const mysqlDialect: Dialect = {
  name: "mysql",
  placeholder: () => "?",
  quoteIdentifier: (name) => `\`${name.replaceAll("`", "``")}\``,
};

/**
 * The MySQL driver of `@stdext/database`, backed by
 * {@link https://sidorares.github.io/node-mysql2 | mysql2}. It implements the
 * driver level of the specification: connections to a database. Applications
 * use a {@linkcode MysqlClient}, which adds pooling, transactions and result
 * handling on top.
 *
 * The connection URL is a MySQL connection URI, e.g.
 * `mysql://user:password@localhost:3306/database`. Parameters use `?`
 * placeholders. Statements are sent with the text protocol, which lets
 * `executeScript` run multiple statements. As a result `execute` and `query`
 * do not reject them, unlike other databases.
 *
 * `BIGINT` is read as a `number` when it is a safe integer, and as a `bigint`
 * otherwise. MySQL commits DDL statements implicitly, so they can not be rolled
 * back by a transaction.
 */
export class MysqlDriver
  implements Driver<MysqlConnectionOptions, MysqlTransactionOptions> {
  readonly dialect: Dialect = mysqlDialect;

  /**
   * Opens a connection.
   *
   * @param url a MySQL connection URI
   * @param options connection options, and a signal to stop connecting
   * @throws {ConnectionError} when the server can not be reached or refuses
   * the connection, e.g. on a wrong password
   */
  async connect(
    url: string | URL,
    options?: MysqlConnectionOptions & { signal?: AbortSignal },
  ): Promise<MysqlConnection> {
    const signal = options?.signal;
    signal?.throwIfAborted();

    let connection: mysql.Connection | undefined;
    const config: mysql.ConnectionOptions = {
      uri: url.toString(),
      rowsAsArray: true,
      multipleStatements: true,
      // Integers are numbers when they are safe, and strings otherwise
      supportBigNumbers: true,
      ...(options?.connectTimeout !== undefined &&
        { connectTimeout: options.connectTimeout }),
      ...options?.driverOptions,
    };
    const connecting = mysql.createConnection(config);

    try {
      connection = await abortable(connecting, signal);
      return new MysqlConnection(
        connection,
        options?.batchSize ?? 100,
        // Used to cancel queries, which takes a connection of its own
        () => mysql.createConnection(config),
      );
    } catch (error) {
      // An aborted connect may still succeed later, so it is closed then.
      connecting.then((c) => c.destroy(), () => undefined);
      if (signal?.aborted) throw signal.reason;
      throw wrapError(error, ConnectionError);
    }
  }
}

/**
 * A connection of the {@linkcode MysqlDriver}, which also exposes the
 * underlying `mysql2` connection as {@linkcode MysqlConnection.database}.
 */
export class MysqlConnection
  implements DriverConnection<MysqlTransactionOptions> {
  readonly #db: mysql.Connection;
  readonly #batchSize: number;
  readonly #connectForCancel: () => Promise<mysql.Connection>;
  #closed = false;
  #reading: Readable | undefined;

  /**
   * Connections are opened with {@linkcode MysqlDriver.connect}.
   *
   * @ignore
   */
  constructor(
    db: mysql.Connection,
    batchSize: number,
    connectForCancel: () => Promise<mysql.Connection>,
  ) {
    this.#db = db;
    this.#batchSize = batchSize;
    this.#connectForCancel = connectForCancel;
    // A lost connection can not be used again
    (db as unknown as { connection: RawConnection }).connection.on(
      "end",
      () => this.#closed = true,
    );
    db.on("error", () => this.#closed = true);
  }

  get closed(): boolean {
    return this.#closed;
  }

  /** The callback API connection under the promise API, which can stream */
  get #raw(): RawConnection {
    return (this.#db as unknown as { connection: RawConnection }).connection;
  }

  /** The underlying `mysql2` connection, for MySQL features */
  get database(): mysql.Connection {
    return this.#db;
  }

  #assertUsable(signal?: AbortSignal): void {
    signal?.throwIfAborted();
    if (this.#closed) throw new ConnectionError("Connection is closed");
    if (this.#reading) {
      throw new QueryError(
        "Connection is busy, close the rows being read first",
      );
    }
  }

  async #run<T>(
    fn: () => PromiseLike<T>,
    options?: DriverQueryOptions,
    ErrorClass?: new (message: string) => DatabaseError,
  ): Promise<T> {
    const signal = options?.signal;
    try {
      this.#assertUsable(signal);
      return await abortable(fn(), signal);
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      throw wrapError(error, ErrorClass);
    }
  }

  async #query(
    sql: string,
    params: QueryParameters | undefined,
    options: DriverQueryOptions | undefined,
    statement?: mysql.PreparedStatementInfo,
  ): Promise<DriverRows> {
    const signal = options?.signal;
    const values = toMysqlParams(params);

    if (statement) {
      // Prepared statements buffer their rows
      const [rows, fields] = await this.#run(
        () => statement.execute(values),
        options,
      ) as unknown as [unknown[][], Fields];
      return bufferedRows(rows, fields);
    }

    this.#assertUsable(signal);
    const query = this.#raw.query({ sql, values, rowsAsArray: true });
    const stream = query.stream({ highWaterMark: this.#batchSize });
    this.#reading = stream;

    // Whether the server is done with the query, which is not the same as the
    // stream being done: a destroyed stream is still being sent the rest.
    let completed = false;
    const markCompleted = () => completed = true;
    query.once("end", markCompleted);
    // Errors reach the consumer through the stream
    query.on("error", markCompleted);

    // Wait for the result set, so that errors reject the query
    let fields: Fields;
    try {
      fields = await abortable(
        new Promise<Fields>((resolve, reject) => {
          stream.once("fields", resolve);
          stream.once("error", reject);
          // Statements without a result set only end
          stream.once("end", () => resolve(undefined));
          stream.once("close", () => resolve(undefined));
        }),
        signal,
      );
    } catch (error) {
      await this.#release(stream, () => completed);
      if (signal?.aborted) throw signal.reason;
      throw wrapError(error);
    }

    const bigints = bigintColumns(fields);
    let consumed = false;
    const finish = () => this.#release(stream, () => completed);
    return {
      columns: fields?.map((field) => field.name) ?? [],
      async *[Symbol.asyncIterator]() {
        if (consumed) return;
        consumed = true;
        try {
          for await (const row of stream) {
            yield toRow(row as unknown[], bigints);
            signal?.throwIfAborted();
          }
        } catch (error) {
          if (signal?.aborted) throw error;
          throw wrapError(error);
        } finally {
          await finish();
        }
      },
      [Symbol.asyncDispose]: finish,
    };
  }

  /**
   * Stops reading rows. When the server is still sending, the query is
   * cancelled with `KILL QUERY` from another connection, instead of the
   * connection receiving and discarding the rest of the rows. The connection
   * is busy until the query is done, so the kill can not hit a later query.
   */
  async #release(stream: Readable, completed: () => boolean): Promise<void> {
    if (this.#reading !== stream) return;
    if (!stream.destroyed) stream.destroy();
    // The stream pauses the connection when its buffer is full
    this.#raw.resume();

    try {
      if (!completed() && !this.#closed) {
        await this.#cancel();
        // Commands run in order, so this returns when the query is done
        await this.#db.ping().catch(() => undefined);
      }
    } finally {
      if (this.#reading === stream) this.#reading = undefined;
    }
  }

  /** Cancel the running query, on best effort */
  async #cancel(): Promise<void> {
    const threadId = (this.#db as unknown as { threadId?: number }).threadId;
    if (!Number.isInteger(threadId)) return;
    let canceller: mysql.Connection | undefined;
    try {
      canceller = await this.#connectForCancel();
      await canceller.query(`KILL QUERY ${threadId}`);
    } catch {
      // The rows are then received and discarded
    } finally {
      await canceller?.end().catch(() => canceller?.destroy());
    }
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    if (this.#reading) {
      // Do not wait for the rows that are still being sent
      this.#reading.destroy();
      this.#reading = undefined;
      this.#db.destroy();
      return;
    }
    try {
      await this.#db.end();
    } catch {
      this.#db.destroy();
    }
  }

  async execute(
    sql: string,
    params?: QueryParameters,
    options?: DriverQueryOptions,
  ): Promise<ExecuteResult> {
    const values = toMysqlParams(params);
    const [result] = await this.#run(
      () => this.#db.query({ sql, values, rowsAsArray: true }),
      options,
    );
    return toExecuteResult(result);
  }

  query(
    sql: string,
    params?: QueryParameters,
    options?: DriverQueryOptions,
  ): Promise<DriverRows> {
    return this.#query(sql, params, options);
  }

  async executeScript(
    sql: string,
    options?: DriverQueryOptions,
  ): Promise<void> {
    await this.#run(() => this.#db.query(sql), options);
  }

  async ping(): Promise<void> {
    await this.#run(() => this.#db.ping(), undefined, ConnectionError);
  }

  async begin(options?: MysqlTransactionOptions): Promise<DriverTransaction> {
    const { isolationLevel, readOnly } = options ?? {};
    if (isolationLevel && !ISOLATION_LEVELS.has(isolationLevel)) {
      throw new TransactionError(`Invalid isolation level: ${isolationLevel}`);
    }
    if (isolationLevel) {
      await this.#run(
        () =>
          this.#db.query(
            `SET TRANSACTION ISOLATION LEVEL ${isolationLevel.toUpperCase()}`,
          ),
        undefined,
        TransactionError,
      );
    }
    await this.#run(
      () =>
        this.#db.query(
          `START TRANSACTION${
            readOnly !== undefined
              ? (readOnly ? " READ ONLY" : " READ WRITE")
              : ""
          }`,
        ),
      undefined,
      TransactionError,
    );
    return this.#transaction();
  }

  #transaction(): DriverTransaction {
    let active = true;
    const control = (sql: string, end = false) =>
      this.#run(
        async () => {
          if (!active) throw new TransactionError("Transaction is not active");
          await this.#db.query(sql);
          if (end) active = false;
        },
        undefined,
        TransactionError,
      );

    return {
      commit: () => control("COMMIT", true),
      rollback: () => control("ROLLBACK", true),
      savepoint: async (name: string): Promise<DriverSavepoint> => {
        if (!IDENTIFIER.test(name)) {
          throw new TransactionError(`Invalid savepoint name: ${name}`);
        }
        await control(`SAVEPOINT ${name}`);
        return this.#savepoint(name, () => active);
      },
      [Symbol.asyncDispose]: async (): Promise<void> => {
        if (active && !this.#closed) await control("ROLLBACK", true);
      },
    };
  }

  #savepoint(name: string, transactionActive: () => boolean): DriverSavepoint {
    let active = true;
    const end = (sql: string) =>
      this.#run(
        async () => {
          if (!active || !transactionActive()) {
            throw new TransactionError("Savepoint is not active");
          }
          await this.#db.query(sql);
          active = false;
        },
        undefined,
        TransactionError,
      );
    const rollback = () =>
      end(`ROLLBACK TO SAVEPOINT ${name}; RELEASE SAVEPOINT ${name}`);
    return {
      release: () => end(`RELEASE SAVEPOINT ${name}`),
      rollback,
      async [Symbol.asyncDispose]() {
        if (active && transactionActive()) await rollback();
      },
    };
  }

  async prepare(sql: string): Promise<DriverStatement> {
    const statement = await this.#run(() => this.#db.prepare(sql));
    let deallocated = false;
    const assertUsable = () => {
      if (deallocated) {
        throw new QueryError("Prepared statement is deallocated");
      }
    };
    const deallocate = async () => {
      if (deallocated) return;
      deallocated = true;
      if (!this.#closed) await statement.close().catch(() => undefined);
    };
    return {
      sql,
      execute: async (params, options) => {
        assertUsable();
        const values = toMysqlParams(params);
        const [result] = await this.#run(
          () => statement.execute(values),
          options,
        );
        return toExecuteResult(result);
      },
      query: async (params, options) => {
        assertUsable();
        return await this.#query(sql, params, options, statement);
      },
      deallocate,
      [Symbol.asyncDispose]: deallocate,
    };
  }

  /** Closes the connection */
  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }
}

function bufferedRows(rows: unknown[][], fields: Fields): DriverRows {
  let consumed = false;
  const bigints = bigintColumns(fields);
  return {
    columns: fields?.map((field) => field.name) ?? [],
    async *[Symbol.asyncIterator]() {
      if (consumed) return;
      consumed = true;
      for (const row of Array.isArray(rows) ? rows : []) {
        yield toRow(row, bigints);
      }
    },
    [Symbol.asyncDispose]() {
      consumed = true;
      return Promise.resolve();
    },
  };
}
