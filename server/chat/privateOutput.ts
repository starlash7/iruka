const normalize=(text:string)=>text.normalize('NFKC').replace(/[\s\p{Cf}]+/gu,'').toLowerCase();
/** Exact/long-fragment copying defense only; paraphrase and encoded extraction need model evaluation. */
export function containsPrivateOutput(text:string,privateTexts:readonly string[]):boolean {
 const output=normalize(text),fragments=new Set<string>();
 for(const value of privateTexts){
  const secret=normalize(value);
  if(secret.length<8)continue;
  if(secret.length<64){if(output.includes(secret))return true;continue;}
  // Any copied run of >=96 UTF-16 units contains a sampled 64-unit window.
  for(let offset=0;offset+64<=secret.length;offset+=32)fragments.add(secret.slice(offset,offset+64));
  fragments.add(secret.slice(-64));
 }
 // Scan output once; do not perform a full output search for every private fragment.
 for(let offset=0;offset+64<=output.length;offset++)if(fragments.has(output.slice(offset,offset+64)))return true;
 return false;
}
