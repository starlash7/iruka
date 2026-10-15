import {mkdir,readFile,writeFile,link,unlink} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {ImageStorage} from './storage.ts';
/** Explicit local development/test adapter, never enabled by a default or env toggle. */
export function createLocalImageStorage(directory:string):ImageStorage {
 if(process.env.NODE_ENV==='production'||process.env.VERCEL)throw new Error('Local image storage is development-only');
 const root=resolve(directory);
 function filePath(key:string){if(!/^[a-f0-9-]{36}\/[a-f0-9]{64}$/.test(key))throw new Error('Invalid image key');return join(root,`${key}.png`);}
 return {
  async put(key,bytes){
   const path=filePath(key);await mkdir(dirname(path),{recursive:true});
   const temporary=`${path}.${randomUUID()}.tmp`;
   await writeFile(temporary,bytes,{flag:'wx',mode:0o600});
   try{try{await link(temporary,path);}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;const previous=await readFile(path);if(!previous.equals(Buffer.from(bytes)))throw new Error('Immutable image content mismatch');}}
   finally{await unlink(temporary);}
  },
  async get(key){try{return await readFile(filePath(key));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}},
 };
}
