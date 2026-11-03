import {readFile} from 'node:fs/promises';
import type {Database} from '../db/index.ts';
/** Separate owned migration; common migration runner integration is a handoff. */
export async function migrateStudio(db:Database) {
 await db.transaction(async tx=>{
  await tx.query('SELECT pg_advisory_xact_lock(20261014)');
  for(const version of ['0200_studio','0201_asset_versions']){
   if((await tx.query('SELECT version FROM schema_migrations WHERE version=$1',[version])).rows.length)continue;
   await tx.query(await readFile(new URL(`./migrations/${version}.sql`,import.meta.url),'utf8'));
   await tx.query('INSERT INTO schema_migrations(version) VALUES($1)',[version]);
  }
 });
}
