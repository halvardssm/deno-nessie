import { Client, ClientConfig } from 'https://deno.land/x/mysql@2.2.0/mod.ts'
import { AbstractClient, ClientI } from './AbstractClient.ts'

export class ClientMySQL extends AbstractClient implements ClientI {
  private client: Client
  private clientOptions: ClientConfig

  private QUERY_MIGRATION_TABLE_EXISTS =
    // `show tables like '${this.TABLE_MIGRATIONS}';`;
    `SELECT * FROM information_schema.tables WHERE table_name = '${this.TABLE_MIGRATIONS}' LIMIT 1;`
  private QUERY_CREATE_MIGRATION_TABLE =
    `CREATE TABLE ${this.TABLE_MIGRATIONS} (id bigint UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, ${this.COL_FILE_NAME} varchar(${AbstractClient.MAX_FILE_NAME_LENGTH}) NOT NULL UNIQUE, ${this.COL_CREATED_AT} datetime NOT NULL DEFAULT CURRENT_TIMESTAMP);`

  constructor(migrationFolder: string, connectionOptions: ClientConfig) {
    super(migrationFolder)
    this.clientOptions = connectionOptions
    this.client = new Client()
  }

  async prepare(): Promise<void> {
    await this.client.connect(this.clientOptions)
    const queryResult = await this.query(this.QUERY_MIGRATION_TABLE_EXISTS)

    const migrationTableExists = queryResult?.[0]?.length > 0

    if (!migrationTableExists) {
      await this.query(this.QUERY_CREATE_MIGRATION_TABLE)
      console.info('Database setup complete')
    }
  }

  async query(query: string | string[]): Promise<any> {
    if (typeof query === 'string') query = query.split(';')
    const ra = []

    for await (const qs of query) {
      try {
        if (qs.trim().toLowerCase().startsWith('select') || qs.trim().toLowerCase().startsWith('show')) {
          ra.push(await this.client.query(qs))
        } else {
          ra.push(await this.client.execute(qs))
        }
      } catch (e) {
        if (e?.message === "Query was empty") {
          ra.push(undefined)
        } else {
          throw new Error(query + '\n' + e + '\n' + ra.join('\n'))
        }
      }
    }

    return ra
  }

  async close(): Promise<void> {
    await this.client.close()
  }

  async migrate(amount: number | undefined) {
    const latestMigration = await this.query(this.QUERY_GET_LATEST)
    await super.migrate(
      amount,
      latestMigration?.[0]?.[0]?.[this.COL_FILE_NAME],
      this.query.bind(this),
    )
  }

  async rollback(amount: number | undefined) {
    const allMigrations = await this.query(this.QUERY_GET_ALL)

    const parsedMigrations: string[] = allMigrations?.[0].map((el: any) => el?.[this.COL_FILE_NAME])

    await super.rollback(
      amount,
      parsedMigrations,
      this.query.bind(this),
    )
  }
}
