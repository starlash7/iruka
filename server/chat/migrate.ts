import {readFile} from 'node:fs/promises';
import type {Database} from '../db/index.ts';
/** Integration owner can register this assigned migration in the common runner. */
export async function migrateChatDatabase(db:Database):Promise<void> {
  await db.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(20261014)');
    if((await tx.query('SELECT version FROM schema_migrations WHERE version=$1',['0100'])).rows.length)return;
    await tx.query(await readFile(new URL('../../supabase/migrations/0100_chat.sql',import.meta.url),'utf8'));
    await tx.query('INSERT INTO schema_migrations(version) VALUES($1)',['0100']);
  });
}
