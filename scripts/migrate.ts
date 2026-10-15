import {openDatabase} from '../server/db/index.ts';
import {migrateProductDatabase} from '../server/product/migrate.ts';
const db=await openDatabase(process.env.DATABASE_URL?{databaseUrl:process.env.DATABASE_URL}:{dataDir:process.env.LOCAL_DATABASE_DIR??'.context/local-db'});
try{await migrateProductDatabase(db);console.log('Database migrations applied.');}finally{await db.close();}
