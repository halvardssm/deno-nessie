import postgres from "postgres";
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
} from "@stdx/database/sql";

/** The options of {@link https://github.com/porsager/postgres | postgres} */
export type PostgresOptions = NonNullable<Parameters<typeof postgres>[1]>;

/** A reserved connection of {@link https://github.com/porsager/postgres | postgres} */
export type PostgresReservedSql = Awaited<
  ReturnType<ReturnType<typeof postgres>["reserve"]>
>;

/** Options used when connecting to Postgres */
export interface PostgresConnectionOptions extends ConnectionOptions {
  /** The number of rows fetched at a time when reading rows. Defaults to `100`. */
  batchSize?: number;
  /**
   * Options passed to {@link https://github.com/porsager/postgres | postgres}
   * as is, e.g. `ssl`. They take precedence over the options and the URL.
   */
  driverOptions?: PostgresOptions;
}

/** The options of a Postgres transaction */
export interface PostgresTransactionOptions extends TransactionOptions {
  /** The isolation level of the transaction */
  isolationLevel?:
    | "read uncommitted"
    | "read committed"
    | "repeatable read"
    | "serializable";
  /** Whether the transaction is read only */
  readOnly?: boolean;
  /** Whether a serializable read only transaction may be deferred */
  deferrable?: boolean;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ISOLATION_LEVELS = new Set([
  "read uncommitted",
  "read committed",
  "repeatable read",
  "serializable",
]);
/** The commands whose count is the number of affected rows */
const MODIFYING = new Set(["INSERT", "UPDATE", "DELETE", "MERGE"]);
/** Connection level error codes: the server refused or lost the connection */
const CONNECTION_CODES =
  /^(ECONN|ENOTFOUND|ETIMEDOUT|EPIPE|CONNECT|CONNECTION|28|3D|08|57P)/;

/**
 * `postgres` uses the simple protocol, which allows multiple statements, for
 * statements without parameters, unless `simple` is `false`. The typings do
 * not know the option.
 */
function extended(prepare: boolean): postgres.UnsafeQueryOptions {
  return { prepare, simple: false } as postgres.UnsafeQueryOptions;
}

const bigintType = {
  to: 20,
  from: [20],
  serialize: (value: bigint | number) => value.toString(),
  parse: (text: string) => {
    const value = BigInt(text);
    return value >= BigInt(Number.MIN_SAFE_INTEGER) &&
        value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value;
  },
};

type Sql = postgres.Sql | postgres.ReservedSql;
type PendingQuery = postgres.PendingQuery<postgres.Row[]>;

function toPostgresValue(value: unknown): postgres.ParameterOrJSON<never> {
  if (value === undefined) return null as never;
  if (value instanceof ArrayBuffer) return new Uint8Array(value) as never;
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    ) as never;
  }
  return value as never;
}

function toPostgresParams(params: QueryParameters | undefined) {
  if (params === undefined) return [];
  if (!Array.isArray(params)) {
    throw new QueryError(
      "Postgres does not support named parameters, use $1 placeholders with an array",
    );
  }
  return params.map(toPostgresValue);
}

/** Report errors of `postgres` as spec errors */
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

/**
 * The SQL dialect of Postgres: `$1` placeholders and double quoted
 * identifiers.
 */
export const postgresDialect: Dialect = {
  name: "postgres",
  placeholder: (index) => `$${index + 1}`,
  quoteIdentifier: (name) => `"${name.replaceAll('"', '""')}"`,
};

/**
 * The Postgres driver of `@stdx/database`, backed by
 * {@link https://github.com/porsager/postgres | postgres}. It implements the
 * driver level of the specification: connections to a database. Applications
 * use a {@linkcode PostgresClient}, which adds pooling, transactions and
 * result handling on top.
 *
 * The connection URL is a Postgres connection URI, e.g.
 * `postgres://user:password@localhost:5432/database`. Parameters use `$1`
 * placeholders, and rows are streamed in batches of
 * {@linkcode PostgresConnectionOptions.batchSize}.
 */
export class PostgresDriver
  implements Driver<PostgresConnectionOptions, PostgresTransactionOptions> {
  readonly dialect: Dialect = postgresDialect;

  /**
   * Opens a connection, and checks that the server accepts it.
   *
   * @param url a Postgres connection URI
   * @param options connection options, and a signal to stop connecting
   * @throws {ConnectionError} when the server can not be reached or refuses
   * the connection, e.g. on a wrong password
   */
  async connect(
    url: string | URL,
    options?: PostgresConnectionOptions & { signal?: AbortSignal },
  ): Promise<PostgresConnection> {
    const signal = options?.signal;
    signal?.throwIfAborted();

    const sql = postgres(url.toString(), {
      max: 1,
      onnotice: () => undefined,
      // BIGINT is a number when it is safe, and a bigint otherwise
      types: { bigint: bigintType },
      ...(options?.connectTimeout !== undefined && {
        connect_timeout: Math.max(1, Math.ceil(options.connectTimeout / 1000)),
      }),
      ...options?.driverOptions,
    });

    try {
      const reserved = await abortable(sql.reserve(), signal);
      // Connecting is lazy, so make sure that the server accepts us.
      await abortable(reserved`SELECT 1`, signal);
      return new PostgresConnection(sql, reserved, options?.batchSize ?? 100);
    } catch (error) {
      await sql.end({ timeout: 0 }).catch(() => undefined);
      if (signal?.aborted) throw signal.reason;
      throw wrapError(error, ConnectionError);
    }
  }
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
 * A connection of the {@linkcode PostgresDriver}. It holds one reserved
 * connection of `postgres`.
 */
export class PostgresConnection
  implements DriverConnection<PostgresTransactionOptions> {
  readonly #sql: postgres.Sql;
  readonly #reserved: postgres.ReservedSql;
  readonly #batchSize: number;
  #closed = false;
  #reading = false;

  /**
   * Connections are opened with {@linkcode PostgresDriver.connect}.
   *
   * @ignore
   */
  constructor(
    sql: postgres.Sql,
    reserved: postgres.ReservedSql,
    batchSize: number,
  ) {
    this.#sql = sql;
    this.#reserved = reserved;
    this.#batchSize = batchSize;
  }

  get closed(): boolean {
    return this.#closed;
  }

  /** The underlying reserved `postgres` connection, for Postgres features */
  get database(): PostgresReservedSql {
    return this.#reserved;
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

  /** Run an operation, cancelling it on abort and reporting spec errors */
  async #run<T>(
    fn: (sql: Sql) => PromiseLike<T> & { cancel?: () => void },
    options?: DriverQueryOptions,
    ErrorClass?: new (message: string) => DatabaseError,
  ): Promise<T> {
    const signal = options?.signal;
    try {
      this.#assertUsable(signal);
      const pending = fn(this.#reserved);
      return await abortable(pending, signal).catch((error) => {
        if (signal?.aborted) pending.cancel?.();
        throw error;
      });
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      throw wrapError(error, ErrorClass);
    }
  }

  #unsafe(
    sql: string,
    params: QueryParameters | undefined,
    prepare = false,
  ): PendingQuery {
    return this.#reserved.unsafe(
      sql,
      toPostgresParams(params) as never,
      extended(prepare),
    );
  }

  async #execute(
    sql: string,
    params: QueryParameters | undefined,
    options: DriverQueryOptions | undefined,
    prepare: boolean,
  ): Promise<ExecuteResult> {
    const result = await this.#run(
      () => this.#unsafe(sql, params, prepare),
      options,
    );
    return {
      affectedRows: MODIFYING.has(result.command) ? result.count : 0,
    };
  }

  async #query(
    sql: string,
    params: QueryParameters | undefined,
    options: DriverQueryOptions | undefined,
    prepare: boolean,
  ): Promise<DriverRows> {
    // Describing reports invalid SQL, and the columns also without rows.
    const description = await this.#run(
      () => this.#unsafe(sql, params, prepare).describe(),
      options,
    );
    const columns = description.columns?.map((column) => column.name) ?? [];

    const signal = options?.signal;
    const iterator = this.#unsafe(sql, params, prepare)
      .values()
      .cursor(this.#batchSize)[Symbol.asyncIterator]();

    // The first batch is read up front, so that errors reject the query.
    this.#reading = true;
    let first: IteratorResult<postgres.Row[]>;
    try {
      first = await abortable(iterator.next(), signal);
    } catch (error) {
      this.#reading = false;
      if (signal?.aborted) throw signal.reason;
      throw wrapError(error);
    }

    let finished = false;
    let consumed = false;
    const finish = async () => {
      if (finished) return;
      finished = true;
      try {
        // Closes the cursor and waits until the connection is free
        await iterator.return?.();
      } finally {
        this.#reading = false;
      }
    };

    return {
      columns,
      async *[Symbol.asyncIterator]() {
        if (consumed) return;
        consumed = true;
        try {
          let result = first;
          while (!result.done && !finished) {
            for (const row of result.value) {
              yield row as unknown[];
              signal?.throwIfAborted();
            }
            result = await iterator.next();
          }
        } catch (error) {
          if (signal?.aborted) throw error;
          throw wrapError(error);
        } finally {
          await finish();
        }
      },
      [Symbol.asyncDispose]: () => finish(),
    };
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    this.#reading = false;
    try {
      this.#reserved.release();
    } catch {
      // already released
    }
    await this.#sql.end({ timeout: 5 });
  }

  execute(
    sql: string,
    params?: QueryParameters,
    options?: DriverQueryOptions,
  ): Promise<ExecuteResult> {
    return this.#execute(sql, params, options, false);
  }

  query(
    sql: string,
    params?: QueryParameters,
    options?: DriverQueryOptions,
  ): Promise<DriverRows> {
    return this.#query(sql, params, options, false);
  }

  async executeScript(
    sql: string,
    options?: DriverQueryOptions,
  ): Promise<void> {
    await this.#run((s) => s.unsafe(sql).simple(), options);
  }

  async ping(): Promise<void> {
    await this.#run((s) => s`SELECT 1`, undefined, ConnectionError);
  }

  async begin(
    options?: PostgresTransactionOptions,
  ): Promise<DriverTransaction> {
    const { isolationLevel, readOnly, deferrable } = options ?? {};
    if (isolationLevel && !ISOLATION_LEVELS.has(isolationLevel)) {
      throw new TransactionError(`Invalid isolation level: ${isolationLevel}`);
    }
    const modes = [
      isolationLevel && `ISOLATION LEVEL ${isolationLevel.toUpperCase()}`,
      readOnly !== undefined && (readOnly ? "READ ONLY" : "READ WRITE"),
      deferrable !== undefined &&
      (deferrable ? "DEFERRABLE" : "NOT DEFERRABLE"),
    ].filter(Boolean).join(" ");

    await this.#run(
      (s) => s.unsafe(`BEGIN ${modes}`).simple(),
      undefined,
      TransactionError,
    );
    return this.#transaction();
  }

  #transaction(): DriverTransaction {
    let active = true;
    const control = (sql: string, end = false) =>
      this.#run(
        async (s) => {
          if (!active) throw new TransactionError("Transaction is not active");
          await s.unsafe(sql).simple();
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
        async (s) => {
          if (!active || !transactionActive()) {
            throw new TransactionError("Savepoint is not active");
          }
          await s.unsafe(sql).simple();
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

  prepare(sql: string): Promise<DriverStatement> {
    let deallocated = false;
    const assertUsable = () => {
      if (deallocated) {
        throw new QueryError("Prepared statement is deallocated");
      }
    };
    // `postgres` prepares named statements on first use and caches them
    // per connection, so preparing here validates the SQL.
    return this.#run((s) => s.unsafe(sql, [], extended(true)).describe())
      .then((): DriverStatement => ({
        sql,
        execute: async (params, options) => {
          assertUsable();
          return await this.#execute(sql, params, options, true);
        },
        query: async (params, options) => {
          assertUsable();
          return await this.#query(sql, params, options, true);
        },
        deallocate: () => {
          deallocated = true;
          return Promise.resolve();
        },
        [Symbol.asyncDispose]() {
          return this.deallocate();
        },
      }));
  }

  /** Closes the connection */
  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }
}
