import type {Database} from '../db/index.ts';
import {migrateDatabase} from '../db/index.ts';
import {migrateChatDatabase} from '../chat/migrate.ts';
import {migrateStudio} from '../studio/migrate.ts';

export async function migrateProductDatabase(db:Database) {
  await migrateDatabase(db);
  await migrateChatDatabase(db);
  await migrateStudio(db);
}
