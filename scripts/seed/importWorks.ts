import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {Database} from '../../server/db/index.ts';
import {createStudioService} from '../../server/studio/index.ts';
import {validateDraft} from '../../server/studio/validate.ts';
import {ApiError} from '../../server/core/errors.ts';
export const seedSlugs=['office-romance','2096-deletion'];
/** Called only by the local CLI or isolated tests. No storage/network operations. */
export async function importSeedWorks(db:Database) {
 return db.transaction(async tx=>{
  await tx.query('SELECT pg_advisory_xact_lock(2026101404)');
  const user=(await tx.query<{id:string}>("INSERT INTO users(privy_did) VALUES ('did:privy:local-studio-seed') ON CONFLICT(privy_did) DO UPDATE SET privy_did=EXCLUDED.privy_did RETURNING id")).rows[0];
  const service=createStudioService({db:tx});const results=[];
  for(const slug of seedSlugs){
   const source=await readFile(new URL(`../../seed/works/${slug}/work.json`,import.meta.url),'utf8');
   const hash=createHash('sha256').update(source).digest('hex');
   const old=(await tx.query<{source_hash:string;work_id:string}>('SELECT source_hash,work_id FROM studio_seed_imports WHERE slug=$1',[slug])).rows[0];
   if(old){if(old.source_hash!==hash)throw new ApiError('CONFLICT','시드 원고가 변경됐어요. 기존 작품을 자동 덮어쓰지 않아요.');results.push({slug,id:old.work_id,created:false});continue;}
   const draft=validateDraft(JSON.parse(source),true);const bindings=draft.assets??[];draft.assets=[];
   let work=await service.saveDraft(user.id,draft);
   for(const binding of bindings){const asset=await service.createAsset(user.id,work.work.id,{code:binding.code,label:binding.code});draft.assets.push({id:asset.id,code:asset.code});}
   work=await service.saveDraft(user.id,{...draft,id:work.work.id,revision:work.revision});
   await service.publishVersion(user.id,work.work.id,work.revision);
   await tx.query('INSERT INTO studio_seed_imports(slug,source_hash,work_id) VALUES($1,$2,$3)',[slug,hash,work.work.id]);
   results.push({slug,id:work.work.id,created:true});
  }
  return results;
 });
}
