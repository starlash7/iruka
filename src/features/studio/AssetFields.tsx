import {useState} from 'react';
import {Button} from '../../ui';
import {Line} from './Fields';
import type {StudioAsset,StudioDraft} from './types';
import {ImageField} from './ImageField';
import type {StudioClient} from './client';
export function getAssetSlots(assets:StudioAsset[],draft:StudioDraft){
 return [...new Set(assets.map(asset=>asset.code))].map(code=>{
  const versions=assets.filter(asset=>asset.code===code).sort((a,b)=>(b.revision??1)-(a.revision??1));
  const selected=versions.find(asset=>draft.assets?.some(binding=>binding.id===asset.id));
  return {latest:versions[0],selected,asset:selected??versions[0]};
 });
}
export function AssetFields({assets,draft,add,change,client,upload}:{assets:StudioAsset[];draft:StudioDraft;add:(code:string,label:string)=>Promise<void>;change:(fn:(d:StudioDraft)=>void)=>void;client:StudioClient;upload:(file:File,assetId:string)=>Promise<void>}) {
 const suggest=()=>{let n=1;while(assets.some(a=>a.code===`YN_${n}`))n++;return `YN_${n}`;};
 const [code,setCode]=useState(''),[label,setLabel]=useState(''),[copyStatus,setCopyStatus]=useState('');
 const bind=(asset:StudioAsset)=>change(d=>{d.assets=[...(d.assets??[]).filter(item=>item.code!==asset.code),{id:asset.id,code:asset.code}];});
 return <><Line label="이미지 코드" value={code||suggest()} max={64} onChange={setCode}/><Line label="이미지 설명" value={label} max={200} onChange={setLabel}/><Button disabled={assets.length>=200} onClick={()=>void add(code||suggest(),label).then(()=>{setCode('');setLabel('');}).catch(()=>{})}>코드 등록</Button>
 <p role="status">{copyStatus}</p>
 <div className="studio-list">{getAssetSlots(assets,draft).map(({asset:a,latest,selected})=><section className="studio-code-slot" key={a.code}>
  <label className="studio-check"><input type="checkbox" checked={!!selected} onChange={e=>e.target.checked?bind(a):change(d=>{d.assets=(d.assets??[]).filter(item=>item.code!==a.code);})}/><code>{`{{img:${a.code}}}`}</code><span>{a.label} · {a.url?'등록됨':'미업로드'}</span></label>
  <ImageField label={`${a.code} 이미지`} value={a.url} client={client} onUpload={file=>upload(file,a.id)}/>
  <div className="studio-toolbar"><Button variant="secondary" onClick={()=>void navigator.clipboard.writeText(`{{img:${a.code}}}`).then(()=>setCopyStatus('이미지 코드를 복사했어요.')).catch(()=>setCopyStatus('코드를 선택해 복사해 주세요.'))}>코드 복사</Button>
  {latest.id!==a.id&&<Button variant="secondary" onClick={()=>bind(latest)}>최신 이미지 사용</Button>}</div>
 </section>)}</div></>;
}
