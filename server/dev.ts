import {openDatabase,migrateDatabase} from './db/index.ts';
import {createTokenVerifier} from './core/auth.ts';
import {createApiHandler} from './app.ts';
import {createNodeServer} from './nodeServer.ts';
const db=await openDatabase(process.env.DATABASE_URL?{databaseUrl:process.env.DATABASE_URL}:{dataDir:process.env.LOCAL_DATABASE_DIR??'.context/local-db'});
await migrateDatabase(db);
const server=createNodeServer(createApiHandler({db,verifyToken:createTokenVerifier({appId:process.env.PRIVY_APP_ID,verificationKey:process.env.PRIVY_VERIFICATION_KEY})}));
server.listen(Number(process.env.API_PORT??8787),'127.0.0.1',()=>console.log(`Local API listening on http://127.0.0.1:${process.env.API_PORT??8787}`));
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{server.close(()=>void db.close().then(()=>process.exit(0)));server.closeAllConnections();});
