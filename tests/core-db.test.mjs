import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase, migrateDatabase } from '../server/db/index.ts'
import { createTestDatabase, seedChat } from './helpers/db.ts'

test('migration is repeatable and databases are isolated', async () => {
  const first = await createTestDatabase(), second = await createTestDatabase()
  try {
    await migrateDatabase(first)
    await first.query("INSERT INTO users(privy_did) VALUES ('did:privy:one')")
    assert.equal((await second.query('SELECT * FROM users')).rows.length,0)
    assert.equal((await first.query('SELECT * FROM schema_migrations')).rows.length,5)
  } finally { await first.close(); await second.close() }
})

test('local PostgreSQL data survives reopening and transaction failures roll back', async () => {
  const directory = await mkdtemp(join(tmpdir(),'iruka-db-'))
  let db = await openDatabase({dataDir: directory})
  try {
    await migrateDatabase(db)
    await assert.rejects(db.transaction(async tx => {
      await tx.query("INSERT INTO users(privy_did) VALUES ('did:privy:rollback')")
      throw new Error('rollback')
    }), /rollback/)
    assert.equal((await db.query('SELECT * FROM users')).rows.length,0)
    await db.query("INSERT INTO users(privy_did) VALUES ('did:privy:persist')")
    await db.close()
    db = await openDatabase({dataDir:directory})
    assert.equal((await db.query('SELECT privy_did FROM users')).rows[0].privy_did,'did:privy:persist')
  } finally { await db.close(); await rm(directory,{recursive:true,force:true}) }
})

test('published versions and chat pins cannot change; drafts cannot start chats', async () => {
  const db = await createTestDatabase()
  try {
    const {versionId,chatId,userId,workId} = await seedChat(db)
    await assert.rejects(db.query("UPDATE work_versions SET private_config='{}' WHERE id=$1",[versionId]),/immutable/)
    await assert.rejects(db.query('DELETE FROM work_versions WHERE id=$1',[versionId]),/immutable/)
    await assert.rejects(db.query("UPDATE chats SET persona_snapshot='{"+'"name":"changed"'+"}' WHERE id=$1",[chatId]),/immutable/)
    const draft = (await db.query('INSERT INTO work_versions(work_id,version) VALUES ($1,2) RETURNING id',[workId])).rows[0]
    await assert.rejects(db.query('INSERT INTO chats(user_id,work_id,work_version_id) VALUES ($1,$2,$3)',[userId,workId,draft.id]),/published/)
  } finally { await db.close() }
})

test('message parents must belong to the same chat and cannot be rewired', async () => {
  const db = await createTestDatabase()
  try {
    const {chatId,userId,workId,versionId} = await seedChat(db)
    const other = (await db.query('INSERT INTO chats(user_id,work_id,work_version_id) VALUES ($1,$2,$3) RETURNING id',[userId,workId,versionId])).rows[0]
    const parent = (await db.query("INSERT INTO messages(chat_id,role,content) VALUES ($1,'user','hello') RETURNING id",[chatId])).rows[0]
    await assert.rejects(db.query("INSERT INTO messages(chat_id,parent_id,role,content) VALUES ($1,$2,'assistant','hi')",[other.id,parent.id]),/foreign key/)
    await assert.rejects(db.query('UPDATE messages SET parent_id=id WHERE id=$1',[parent.id]),/immutable|check constraint/)
  } finally { await db.close() }
})

test('turn identity is user scoped and terminal state is immutable', async () => {
  const db = await createTestDatabase()
  try {
    const {userId,chatId} = await seedChat(db)
    const insert = "INSERT INTO turn_requests(user_id,chat_id,idempotency_key,payload_hash) VALUES ($1,$2,'key',$3) RETURNING id"
    const turn = (await db.query(insert,[userId,chatId,'a'.repeat(64)])).rows[0]
    await assert.rejects(db.query(insert,[userId,chatId,'b'.repeat(64)]),/unique/)
    await assert.rejects(db.query("UPDATE turn_requests SET payload_hash=$1 WHERE id=$2",['b'.repeat(64),turn.id]),/immutable/)
    await db.query("UPDATE turn_requests SET status='succeeded',response='{}' WHERE id=$1",[turn.id])
    await assert.rejects(db.query("UPDATE turn_requests SET status='failed' WHERE id=$1",[turn.id]),/terminal/)
  } finally { await db.close() }
})

test('free ledger accepts signed entries but rejects mutation and duplicate keys', async () => {
  const db = await createTestDatabase()
  try {
    const {userId} = await seedChat(db)
    await db.query("INSERT INTO credit_ledger(user_id,kind,amount,idempotency_key) VALUES ($1,'grant',10,'grant')",[userId])
    await assert.rejects(db.query("INSERT INTO credit_ledger(user_id,kind,amount,idempotency_key) VALUES ($1,'grant',10,'grant')",[userId]),/unique/)
    await assert.rejects(db.query('UPDATE credit_ledger SET amount=20'),/append-only/)
    await assert.rejects(db.query('DELETE FROM credit_ledger'),/append-only/)
    await assert.rejects(db.query('TRUNCATE credit_ledger'),/append-only/)
    await assert.rejects(db.query("INSERT INTO credit_ledger(user_id,kind,amount,idempotency_key) VALUES ($1,'grant',-10,'invalid')",[userId]),/check constraint/)
  } finally { await db.close() }
})

test('multirow inserts cannot form message cycles', async () => {
  const db = await createTestDatabase()
  try {
    const {chatId} = await seedChat(db)
    await assert.rejects(db.query(`INSERT INTO messages(id,chat_id,parent_id,role,content) VALUES
      ('11111111-1111-4111-8111-111111111111',$1,'22222222-2222-4222-8222-222222222222','user','one'),
      ('22222222-2222-4222-8222-222222222222',$1,'11111111-1111-4111-8111-111111111111','assistant','two')`,[chatId]),/parent/)
  } finally { await db.close() }
})

test('nested transactions can roll back independently', async () => {
  const db = await createTestDatabase()
  try {
    await db.transaction(async tx => {
      await tx.query("INSERT INTO users(privy_did) VALUES ('did:privy:outer')")
      await assert.rejects(tx.transaction(async nested => {
        await nested.query("INSERT INTO users(privy_did) VALUES ('did:privy:inner')")
        throw new Error('inner rollback')
      }),/inner rollback/)
    })
    assert.deepEqual((await db.query('SELECT privy_did FROM users')).rows,[{privy_did:'did:privy:outer'}])
  } finally { await db.close() }
})

test('chat version, persona, turn and ledger references preserve ownership', async () => {
  const db = await createTestDatabase()
  try {
    const {chatId,userId,versionId} = await seedChat(db)
    const stranger = (await db.query("INSERT INTO users(privy_did) VALUES ('did:privy:stranger') RETURNING id")).rows[0].id
    const otherWork = (await db.query("INSERT INTO works(owner_id,mode,title) VALUES ($1,'story','다른 작품') RETURNING id",[stranger])).rows[0].id
    const persona = (await db.query("INSERT INTO personas(user_id,name) VALUES ($1,'다른 사용자') RETURNING id",[stranger])).rows[0].id
    await assert.rejects(db.query('INSERT INTO chats(user_id,work_id,work_version_id) VALUES ($1,$2,$3)',[userId,otherWork,versionId]),/foreign key/)
    await assert.rejects(db.query('INSERT INTO chats(user_id,work_id,work_version_id,persona_id) SELECT $1,work_id,id,$2 FROM work_versions WHERE id=$3',[userId,persona,versionId]),/foreign key/)
    await assert.rejects(db.query("INSERT INTO turn_requests(user_id,chat_id,idempotency_key,payload_hash) VALUES ($1,$2,'key',$3)",[stranger,chatId,'a'.repeat(64)]),/foreign key/)
    const turn = (await db.query("INSERT INTO turn_requests(user_id,chat_id,idempotency_key,payload_hash) VALUES ($1,$2,'owned',$3) RETURNING id",[userId,chatId,'a'.repeat(64)])).rows[0].id
    await assert.rejects(db.query("INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key) VALUES ($1,$2,'reserve',-5,'reserve')",[stranger,turn]),/foreign key/)
    await db.query("INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key) VALUES ($1,$2,'reserve',-5,'reserve'),($1,$2,'release',2,'release'),($1,$2,'charge',0,'charge')",[userId,turn])
    assert.equal(Number((await db.query('SELECT sum(amount) AS amount FROM credit_ledger')).rows[0].amount),-3)
  } finally { await db.close() }
})


test('existing 0001 databases upgrade once and reject duplicate turn operations across keys', async () => {
  const db = await openDatabase()
  try {
    await db.query(await readFile(new URL('../migrations/0001_foundation.sql',import.meta.url),'utf8'))
    await db.query("CREATE TABLE schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()); INSERT INTO schema_migrations(version) VALUES ('0001')")
    const {userId,chatId}=await seedChat(db)
    const turn=(await db.query("INSERT INTO turn_requests(user_id,chat_id,idempotency_key,payload_hash) VALUES ($1,$2,'turn',$3) RETURNING id",[userId,chatId,'a'.repeat(64)])).rows[0].id
    await db.query("INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key) VALUES ($1,$2,'reserve',-5,'reserve-original')",[userId,turn])
    await migrateDatabase(db)
    await migrateDatabase(db)
    assert.deepEqual((await db.query('SELECT version FROM schema_migrations ORDER BY version')).rows,[{version:'0001'},{version:'0002'},{version:'0003'},{version:'0004'},{version:'0005'}])
    assert.equal((await db.query('SELECT * FROM credit_ledger')).rows.length,1)
    const insert="INSERT INTO credit_ledger(user_id,turn_request_id,kind,amount,idempotency_key) VALUES ($1,$2,$3,$4,$5)"
    await assert.rejects(db.query(insert,[userId,turn,'reserve',-5,'reserve-duplicate']),/unique/)
    for (const [kind,amount] of [['release',2],['charge',0]]) {
      await db.query(insert,[userId,turn,kind,amount,kind+'-original'])
      await assert.rejects(db.query(insert,[userId,turn,kind,amount,kind+'-duplicate']),/unique/)
    }
  } finally {await db.close()}
})

test('persistent local database rejects a second opener and releases its lock on close', async () => {
  const directory=await mkdtemp(join(tmpdir(),'iruka-exclusive-'))
  let db
  try {
    db=await openDatabase({dataDir:directory})
    await assert.rejects(openDatabase({dataDir:join(directory,'.')}),/Stop the local API|로컬 API/)
    await db.query('CREATE TABLE lock_test(value integer)')
    await db.close()
    db=undefined
    db=await openDatabase({dataDir:directory})
    assert.equal((await db.query('SELECT * FROM lock_test')).rows.length,0)
  } finally {
    if(db) await db.close()
    await rm(directory,{recursive:true,force:true})
    await rm(directory+'.lock',{force:true})
  }
})

test('fresh and upgraded works preserve cover URL and tags with safe defaults', async () => {
  for (const upgrade of [false,true]) {
    const db=await openDatabase()
    try {
      if(upgrade) {
        await db.query(await readFile(new URL('../migrations/0001_foundation.sql',import.meta.url),'utf8'))
        await db.query(await readFile(new URL('../migrations/0002_ledger_operations.sql',import.meta.url),'utf8'))
        await db.query("CREATE TABLE schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()); INSERT INTO schema_migrations(version) VALUES ('0001'),('0002')")
      } else await migrateDatabase(db)
      const {workId}=await seedChat(db)
      if(upgrade) await migrateDatabase(db)
      assert.deepEqual((await db.query('SELECT cover_url,tags FROM works WHERE id=$1',[workId])).rows[0],{cover_url:null,tags:[]})
      await db.query('UPDATE works SET cover_url=$1,tags=$2 WHERE id=$3',['/brand/test.png',['모험','일상'],workId])
      await migrateDatabase(db)
      assert.deepEqual((await db.query('SELECT cover_url,tags FROM works WHERE id=$1',[workId])).rows[0],{cover_url:'/brand/test.png',tags:['모험','일상']})
    } finally {await db.close()}
  }
})
