import {useState} from 'react';
import {Button} from '../../ui';
import {Line} from './Fields';
import type {StudioAsset,StudioDraft} from './types';
export function AssetFields({assets,draft,add,change}:{assets:StudioAsset[];draft:StudioDraft;add:(code:string,label:string)=>Promise<void>;change:(fn:(d:StudioDraft)=>void)=>void}) {
 const suggest=()=>{let n=1;while(assets.some(a=>a.code===`YN_${n}`))n++;return `YN_${n}`;};
 const [code,setCode]=useState(''),[label,setLabel]=useState('');
 return <><Line label="이미지 코드" value={code||suggest()} max={64} onChange={setCode}/><Line label="이미지 설명" value={label} max={200} onChange={setLabel}/><Button disabled={assets.length>=200} onClick={()=>void add(code||suggest(),label).then(()=>{setCode('');setLabel('');})}>코드 등록</Button>
 <div className="studio-list">{assets.map(a=><label className="studio-work" key={a.id}><input type="checkbox" checked={!!draft.assets?.some(x=>x.id===a.id)} onChange={e=>change(d=>{d.assets=e.target.checked?[...(d.assets??[]),{id:a.id,code:a.code}]:(d.assets??[]).filter(x=>x.id!==a.id);})}/><code>{`{{img:${a.code}}}`}</code><span>{a.label} · {a.url?'등록됨':'미업로드'}</span></label>)}</div></>;
}
