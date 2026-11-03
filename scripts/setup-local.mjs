import {copyFile,chmod} from 'node:fs/promises';
import {constants} from 'node:fs';
try{
 await copyFile(new URL('../.env.example',import.meta.url),new URL('../.env.local',import.meta.url),constants.COPYFILE_EXCL);
 await chmod(new URL('../.env.local',import.meta.url),0o600);
 console.log('.env.local created. Add Privy identifiers locally, then run npm run env:check and npm run db:migrate.');
}catch(error){if(error.code==='EEXIST')console.log('.env.local already exists; no values were changed.');else throw error;}
