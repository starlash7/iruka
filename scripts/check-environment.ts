import {importSPKI} from 'jose';
import {access} from 'node:fs/promises';
const env=process.env;
let incomplete=false;
function report(label:string,valid:boolean,missing:string){console.log(`${valid?'OK':'TODO'} ${label}${valid?'':`: ${missing}`}`);if(!valid)incomplete=true;}
report('Privy browser app',!!env.VITE_PRIVY_APP_ID?.trim(),'set VITE_PRIVY_APP_ID');
report('Privy server app',!!env.PRIVY_APP_ID?.trim()&&env.PRIVY_APP_ID===env.PRIVY_APP_ID.trim()&&env.PRIVY_APP_ID===env.VITE_PRIVY_APP_ID?.trim(),'set matching PRIVY_APP_ID');
let validKey=false;
try{if(env.PRIVY_VERIFICATION_KEY){await importSPKI(env.PRIVY_VERIFICATION_KEY.replace(/\\n/g,'\n'),'ES256');validKey=true;}}catch{}
report('Privy verification key',validKey,'set the ES256 public verification key');
console.log(`INFO Database: ${env.DATABASE_URL?'external PostgreSQL configured (not connected by this check)':'persistent local PGlite'}`);
console.log(`INFO Model: ${env.LOCAL_LIVE_MODEL==='1'?'explicit local runtime requested':env.LOCAL_TEST_CHAT==='1'?'deterministic local test':'disabled'}`);
if(env.LOCAL_LIVE_MODEL==='1'){
 report('Model key',!!env.OPENAI_API_KEY?.trim(),'set server-only OPENAI_API_KEY');
 let exists=false;try{await access(new URL('../.context/model-runtime.ts',import.meta.url));exists=true;}catch{}
 report('Model policy file',exists,'create .context/model-runtime.ts with an explicit policy');
 report('Single model mode',env.LOCAL_TEST_CHAT!=='1','disable LOCAL_TEST_CHAT before requesting live model');
}
console.log('INFO This checks configuration only. Google OAuth, email delivery, DB connectivity and model calls are not verified.');
process.exitCode=incomplete?1:0;
