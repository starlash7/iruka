import {openDatabase,migrateDatabase} from '../../server/db/index.ts';
import {migrateStudio} from '../../server/studio/migrate.ts';
import {importSeedWorks} from './importWorks.ts';
// Deliberately no DATABASE_URL support and no caller-supplied remote target.
if(process.env.DATABASE_URL||process.argv.slice(2).join(' ')!=='--local')throw new Error('Use --local with DATABASE_URL unset. Target: .context/studio-seed-db');
const db=await openDatabase({dataDir:'.context/studio-seed-db'});
try {await migrateDatabase(db);await migrateStudio(db);console.log(JSON.stringify(await importSeedWorks(db),null,2));}
finally {await db.close();}
