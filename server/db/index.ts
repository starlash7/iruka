import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, realpath, unlink } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import postgres from 'postgres'

export interface Database {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>
  transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>
  close(): Promise<void>
}

/** No options creates an isolated in-memory database; dataDir persists local data. */
export async function openDatabase(options: { dataDir?: string; databaseUrl?: string } = {}): Promise<Database> {
  if (options.databaseUrl && options.dataDir) throw new Error('Choose dataDir or databaseUrl')
  if (options.databaseUrl) {
    const client = postgres(options.databaseUrl)
    function wrap(connection: postgres.Sql | postgres.TransactionSql): Database {
      return {
        async query<T>(sql: string, params: unknown[] = []) {
          const rows = await connection.unsafe(sql, params as postgres.ParameterOrJSON<never>[])
          return { rows: rows as unknown as T[] }
        },
        async transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
          if ('begin' in connection) return connection.begin(tx => fn(wrap(tx))) as Promise<T>
          return connection.savepoint(tx => fn(wrap(tx))) as Promise<T>
        },
        async close() { await client.end() },
      }
    }
    return wrap(client)
  }
  let releaseLock = async () => {}
  let dataDir = options.dataDir
  if (dataDir) {
    await mkdir(dataDir, { recursive: true })
    dataDir = await realpath(dataDir)
    const lockPath = `${dataDir}.lock`
    let lock
    try {
      lock = await open(lockPath, 'wx')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`Local database is locked: ${lockPath}. Stop the local API before opening it. Remove a stale lock only after verifying its process has stopped.`)
      }
      throw error
    }
    let released = false
    releaseLock = async () => {
      if (released) return
      released = true
      try { await lock.close() } finally { await unlink(lockPath) }
    }
    try { await lock.writeFile(String(process.pid)) }
    catch (error) { await releaseLock(); throw error }
  }
  let client: PGlite
  try {
    client = new PGlite(dataDir)
    await client.waitReady
  } catch (error) {
    await releaseLock()
    throw error
  }
  function wrap(connection: Pick<PGlite, 'query' | 'exec'> & Partial<Pick<PGlite, 'transaction'>>): Database {
    return {
      async query<T>(sql: string, params: unknown[] = []) {
        if (params.length) return { rows: (await connection.query<T>(sql, params)).rows }
        const results = await connection.exec(sql)
        return { rows: (results.at(-1)?.rows ?? []) as T[] }
      },
      async transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
        if (connection.transaction) return connection.transaction(tx => fn(wrap(tx)))
        const savepoint = `sp_${randomUUID().replaceAll('-', '')}`
        await connection.exec(`SAVEPOINT ${savepoint}`)
        try {
          const result = await fn(wrap(connection))
          await connection.exec(`RELEASE SAVEPOINT ${savepoint}`)
          return result
        } catch (error) {
          await connection.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`)
          await connection.exec(`RELEASE SAVEPOINT ${savepoint}`)
          throw error
        }
      },
      async close() {
        try { await client.close() } finally { await releaseLock() }
      },
    }
  }
  return wrap(client)
}

export async function migrateDatabase(db: Database): Promise<void> {
  const migrations = ['0001_foundation.sql', '0002_ledger_operations.sql', '0003_work_metadata.sql', '0004_persona_deletion.sql', '0005_user_profiles.sql', '0006_reader_library.sql']
  await db.transaction(async tx => {
    // Serializes concurrent migration runners on the same PostgreSQL database.
    await tx.query('SELECT pg_advisory_xact_lock(20261014)')
    await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
    for (const filename of migrations) {
      const version = filename.slice(0, 4)
      const existing = await tx.query('SELECT version FROM schema_migrations WHERE version=$1', [version])
      if (existing.rows.length) continue
      const sql = await readFile(new URL(`../../migrations/${filename}`, import.meta.url), 'utf8')
      await tx.query(sql)
      await tx.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version])
    }
  })
}
