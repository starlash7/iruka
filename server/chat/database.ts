import {AsyncLocalStorage} from 'node:async_hooks';
import type {Database} from '../db/index.ts';
const scopedDatabases=new WeakSet<Database>();
/** Construct BOTH chat and CreditsService with this instance. Nested service transactions
 * become savepoints on the same connection, including under remote PostgreSQL. */
export function createChatDatabase(base:Database):Database {
  const scope=new AsyncLocalStorage<Database>();
  const db:Database={
    query(sql,params){return (scope.getStore()??base).query(sql,params);},
    transaction(fn){return (scope.getStore()??base).transaction(tx=>scope.run(tx,()=>fn(db)));},
    close(){return base.close();},
  };
  scopedDatabases.add(db);return db;
}
export function requireChatDatabase(db:Database):void {
  if(!scopedDatabases.has(db))throw new Error('Construct chat and credits with the same createChatDatabase instance');
}
