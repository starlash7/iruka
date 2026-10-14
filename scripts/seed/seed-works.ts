import {openDatabase,migrateDatabase} from '../../server/db/index.ts';
import {migrateStudio} from '../../server/studio/migrate.ts';
import {importSeedWorks} from './importWorks.ts';
// Deliberately no DATABASE_URL support and no caller-supplied remote target.
const target=process.argv.slice(2).join(' ');
if(process.env.DATABASE_URL||process.env.NODE_ENV==='production'||process.env.VERCEL||!['--local','--development'].includes(target))throw new Error('Use --local or --development with DATABASE_URL unset. Local seed import only.');
const db=await openDatabase({dataDir:target==='--development'?(process.env.LOCAL_DATABASE_DIR??'.context/local-db'):'.context/studio-seed-db'});
try {await migrateDatabase(db);await migrateStudio(db);console.log(JSON.stringify(await importSeedWorks(db),null,2));}
finally {await db.close();}
