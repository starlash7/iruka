import {useState} from 'react';
import {Button} from '../../ui';
import {Line} from './Fields';
import type {StudioAsset,StudioDraft} from './types';
import {ImageField,StoredImage} from './ImageField';
import type {StudioClient} from './client';
import {BatchImages} from './BatchImages';
import {getAssetSlots,isImageReferenced,bindDraftAsset} from './assetSlots';
export {getAssetSlots} from './assetSlots';
export function AssetFields({assets,draft,add,change,client,upload,uploadNew}:{assets:StudioAsset[];draft:StudioDraft;add:(code:string,label:string)=>Promise<void>;change:(fn:(d:StudioDraft)=>void)=>void;client:StudioClient;upload:(file:File,assetId:string)=>Promise<void>;uploadNew:(file:File)=>Promise<void>}){
 const [code,setCode]=useState(''),[label,setLabel]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[selectedCode,setSelectedCode]=useState(''),[placement,setPlacement]=useState('cover');
 const suggest=()=>{let n=1;while(assets.some(a=>a.code===`YN_${n}`))n++;return `YN_${n}`;};
 const slots=getAssetSlots(assets,draft),visible=slots.filter(({asset,selected})=>(`${asset.code} ${asset.label}`).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())&&(filter==='all'||(filter==='used'?!!selected:filter==='unused'?!selected:!asset.url)));
 const current=visible.find(item=>item.asset.code===selectedCode)??visible[0];
 const bind=(d:StudioDraft,a:StudioAsset)=>{const previous=assets.find(item=>item.id===d.assets?.find(binding=>binding.code===a.code)?.id);bindDraftAsset(d,a,previous?.url);};
 async function copy(a:StudioAsset){try{await navigator.clipboard.writeText(`{{img:${a.code}}}`);setNotice('이미지 코드를 복사했어요.');}catch{setNotice('표시된 코드를 선택해 복사해 주세요.');}}
 function connect(a:StudioAsset){if(!a.url)return;change(d=>{bind(d,a);if(placement==='cover')d.coverUrl=a.url;else if(placement.startsWith('character:')){const c=d.publicSnapshot.characters.find(item=>item.id===placement.slice(10));if(c)c.imageUrl=a.url;}else{const o=d.publicSnapshot.openings.find(item=>item.id===placement.slice(8));if(o)o.imageUrl=a.url;}});setNotice('초안에 이미지를 연결했어요.');}
 return <><BatchImages upload={uploadNew}/><details className="studio-code-register"><summary>빈 이미지 코드 등록</summary><Line label="이미지 코드" value={code||suggest()} max={64} onChange={setCode}/><Line label="이미지 설명" value={label} max={200} onChange={setLabel}/><Button disabled={assets.length>=200} onClick={()=>void add(code||suggest(),label).then(()=>{setSelectedCode(code||suggest());setCode('');setLabel('');}).catch(()=>{})}>코드 등록</Button></details>
 <div className="studio-list-controls"><label className="studio-field">이미지 검색<input type="search" value={query} maxLength={200} placeholder="코드 또는 설명" onChange={event=>setQuery(event.target.value)}/></label><label className="studio-field">사용 상태<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">전체</option><option value="used">사용 중</option><option value="unused">미사용</option><option value="empty">미업로드</option></select></label></div>
 <p role="status">{notice||`${visible.length}개 코드 · 이전 교체본을 포함한 이미지 ${assets.length} / 200개`}</p>
 <div className="studio-image-library"><div className="studio-image-overview" aria-label="등록 이미지">{visible.map(({asset:a,selected})=><button type="button" key={a.code} aria-pressed={current?.asset.code===a.code} aria-label={`${a.label||a.code} 이미지 관리`} onClick={()=>setSelectedCode(a.code)}>{a.url?<StoredImage url={a.url} alt="" client={client}/>:<span className="studio-empty-thumbnail">미업로드</span>}<strong>{a.label||a.code}</strong><small>{selected?'사용 중':'미사용'}</small></button>)}</div>
 {!visible.length?<p className="studio-image-empty">조건에 맞는 이미지가 없어요. 파일을 등록하거나 검색 조건을 바꿔 보세요.</p>:current&&<section className="studio-code-slot" key={current.asset.code}>
 <label className="studio-check"><input type="checkbox" checked={!!current.selected} disabled={isImageReferenced(draft,current.asset.url)} onChange={event=>change(d=>{if(event.target.checked)bind(d,current.asset);else d.assets=(d.assets??[]).filter(item=>item.code!==current.asset.code);})}/><code>{`{{img:${current.asset.code}}}`}</code></label>
 {isImageReferenced(draft,current.asset.url)&&<small>표지·인물·시작 상황·갤러리에 연결된 이미지는 사용을 유지해요.</small>}
 <ImageField label={current.asset.label||'코드 이미지'} value={current.asset.url} client={client} onUpload={file=>upload(file,current.asset.id)}/>
 <div className="studio-toolbar"><Button variant="secondary" onClick={()=>void copy(current.asset)}>코드 복사</Button>{current.latest.id!==current.asset.id&&<Button variant="secondary" onClick={()=>change(d=>bind(d,current.latest))}>최신 이미지 사용</Button>}</div>
 {current.asset.url&&<><label className="studio-field">이미지 연결 위치<select value={placement} onChange={event=>setPlacement(event.target.value)}><option value="cover">작품 표지</option>{draft.publicSnapshot.characters.map(c=><option key={c.id} value={`character:${c.id}`}>{c.name||'등장인물'}</option>)}{draft.publicSnapshot.openings.map(o=><option key={o.id} value={`opening:${o.id}`}>{o.title||'시작 상황'}</option>)}</select></label><Button variant="secondary" onClick={()=>connect(current.asset)}>선택한 위치에 사용</Button>
 <label className="studio-check"><input type="checkbox" checked={!!draft.publicSnapshot.gallery?.some(item=>item.imageUrl===current.asset.url)} disabled={!draft.publicSnapshot.gallery?.some(item=>item.imageUrl===current.asset.url)&&(draft.publicSnapshot.gallery?.length??0)>=20} onChange={event=>change(d=>{if(event.target.checked){bind(d,current.asset);d.publicSnapshot.gallery=[...(d.publicSnapshot.gallery??[]),{id:current.asset.id,title:current.asset.label.slice(0,100),imageUrl:current.asset.url!,introduction:false}];}else d.publicSnapshot.gallery=d.publicSnapshot.gallery?.filter(item=>item.imageUrl!==current.asset.url);})}/>공개 작품 갤러리에 표시</label>
 {draft.publicSnapshot.gallery?.some(item=>item.imageUrl===current.asset.url)&&<label className="studio-check"><input type="checkbox" checked={draft.publicSnapshot.gallery?.find(item=>item.imageUrl===current.asset.url)?.introduction===true} onChange={event=>change(d=>{const item=d.publicSnapshot.gallery?.find(item=>item.imageUrl===current.asset.url);if(item)item.introduction=event.target.checked;})}/>작품 소개 본문에 배치</label>}</>}
 </section>}
 </div></>;
}
