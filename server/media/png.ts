import {crc32,deflateSync,inflateSync} from 'node:zlib';
import {ApiError} from '../core/errors.ts';
export const MAX_IMAGE_BYTES=5*1024*1024;
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function invalid():never {throw new ApiError('INVALID_REQUEST','5MB 이하의 올바른 PNG 이미지가 필요해요. 최대 크기는 4096×4096이에요.');}
function makeChunk(type:string,body:Buffer){
 const chunk=Buffer.alloc(body.length+12);chunk.writeUInt32BE(body.length);chunk.write(type,4);body.copy(chunk,8);
 chunk.writeUInt32BE(crc32(chunk.subarray(4,-4)),chunk.length-4);return chunk;
}
/** Fully inflates bounded 8-bit RGB/RGBA PNG scanlines; drops metadata and recompresses.
 * Browser canvas emits this subset. No SVG, animation, interlacing or palette input. */
export function normalizePng(input:Uint8Array):Buffer {
 try {
  const bytes=Buffer.from(input);
  if(bytes.length>MAX_IMAGE_BYTES||!bytes.subarray(0,8).equals(signature))invalid();
  let offset=8,header:Buffer|undefined,ended=false,dataEnded=false,width=0,height=0,channels=0;
  const compressed:Buffer[]=[];
  while(offset<bytes.length){
   if(offset+12>bytes.length)invalid();
   const size=bytes.readUInt32BE(offset),end=offset+12+size;
   if(end>bytes.length)invalid();
   const type=bytes.toString('ascii',offset+4,offset+8),body=bytes.subarray(offset+8,end-4);
   if(!/^[A-Za-z]{4}$/.test(type)||!/[A-Z]/.test(type[2]))invalid();
   if(crc32(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4))invalid();
   if(!header&&type!=='IHDR')invalid();
   if(type==='IHDR'){
    if(header||size!==13)invalid();header=Buffer.from(body);width=body.readUInt32BE(0);height=body.readUInt32BE(4);
    if(!width||!height||width>4096||height>4096||width*height>12000000||body[8]!==8||![2,6].includes(body[9])||body[10]||body[11]||body[12])invalid();
    channels=body[9]===6?4:3;
   }else if(type==='IDAT'){
    if(dataEnded)invalid();compressed.push(body);
   }else if(type==='IEND'){
    if(size||end!==bytes.length||!compressed.length)invalid();ended=true;
   }else {
    // Only ancillary chunks may be ignored; never silently accept APNG frames.
    if(!(bytes[offset+4]&32)||['acTL','fcTL','fdAT'].includes(type))invalid();
    if(compressed.length)dataEnded=true;
   }
   offset=end;
  }
  if(!header||!ended)invalid();
  const stride=width*channels+1,expected=stride*height;
  const decoded=inflateSync(Buffer.concat(compressed),{maxOutputLength:expected});
  if(decoded.length!==expected)invalid();
  for(let y=0;y<height;y++)if(decoded[y*stride]>4)invalid();
  const result=Buffer.concat([signature,makeChunk('IHDR',header),makeChunk('IDAT',deflateSync(decoded)),makeChunk('IEND',Buffer.alloc(0))]);
  if(result.length>MAX_IMAGE_BYTES)invalid();return result;
 }catch(error){if(error instanceof ApiError)throw error;return invalid();}
}
export async function readImageBody(request:Request):Promise<Uint8Array> {
 const reader=request.body?.getReader();if(!reader)invalid();
 const chunks:Uint8Array[]=[];let size=0;
 try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_IMAGE_BYTES){await reader.cancel();invalid();}chunks.push(value);}return Buffer.concat(chunks);}
 finally{reader.releaseLock();}
}
