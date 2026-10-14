import {openDatabase,migrateDatabase} from '../server/db/index.ts';
const db=await openDatabase(process.env.DATABASE_URL?{databaseUrl:process.env.DATABASE_URL}:{dataDir:process.env.LOCAL_DATABASE_DIR??'.context/local-db'});
try{await migrateDatabase(db);console.log('Database migrations applied.');}finally{await db.close();}
