import { openDatabase, migrateDatabase } from '../../server/db/index.ts'
import type { Database } from '../../server/db/index.ts'

export async function createTestDatabase(): Promise<Database> {
  const db = await openDatabase()
  await migrateDatabase(db)
  return db
}

export async function seedChat(db: Database) {
  const user = (await db.query<{id:string}>("INSERT INTO users(privy_did) VALUES ('did:privy:test') RETURNING id")).rows[0]
  const work = (await db.query<{id:string}>("INSERT INTO works(owner_id, mode, title) VALUES ($1,'character','테스트') RETURNING id", [user.id])).rows[0]
  const version = (await db.query<{id:string}>("INSERT INTO work_versions(work_id,version,public_snapshot,private_config,published_at) VALUES ($1,1,'{}','{}',now()) RETURNING id", [work.id])).rows[0]
  const chat = (await db.query<{id:string}>("INSERT INTO chats(user_id,work_id,work_version_id,persona_snapshot) VALUES ($1,$2,$3,'{}') RETURNING id", [user.id,work.id,version.id])).rows[0]
  return {userId:user.id,workId:work.id,versionId:version.id,chatId:chat.id}
}
