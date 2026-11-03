import manifest from '../../seed/approved-story-assets.json' with {type:'json'};
import privateManifest from '../../seed/approved-private-assets.json' with {type:'json'};
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const approved=new Set(manifest.assets.map(asset=>asset.url));
export function isBundledStoryImage(value:string){return approved.has(value);}
export function isPrivateStoryImage(code:string,hash:string){return privateManifest.assets.some(asset=>asset.code===code&&asset.sha256===hash);}
/** Called only after media ownership/public-reference/pinned-chat authorization. */
export async function readPrivateStoryImage(hash:string){
 const asset=privateManifest.assets.find(item=>item.sha256===hash);if(!asset)return null;
 const bytes=await readFile(new URL(`../../${asset.path}`,import.meta.url));
 if(createHash('sha256').update(bytes).digest('hex')!==hash)throw new Error('Bundled media integrity mismatch');return bytes;
}
export function imageMime(bytes:Uint8Array){return Buffer.from(bytes.subarray(0,4)).toString()==='RIFF'&&Buffer.from(bytes.subarray(8,12)).toString()==='WEBP'?'image/webp':'image/png';}
