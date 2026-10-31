import {openDatabase} from '../../server/db/index.ts';
import {migrateProductDatabase} from '../../server/product/migrate.ts';
import {attachSeedArtwork} from './attachArtwork.ts';
const target=process.argv.slice(2).join(' ');
if(process.env.DATABASE_URL||process.env.NODE_ENV==='production'||process.env.VERCEL||!['--local','--development'].includes(target))throw new Error('Local seed artwork only; use --local or --development with DATABASE_URL unset.');
const db=await openDatabase({dataDir:target==='--development'?(process.env.LOCAL_DATABASE_DIR??'.context/local-db'):'.context/studio-seed-db'});
try{await migrateProductDatabase(db);console.log(JSON.stringify(await attachSeedArtwork(db),null,2));}finally{await db.close();}
