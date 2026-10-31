import {getAccessToken} from '@privy-io/react-auth';
import {createApiClient} from '../../shared/apiClient';
import type {PrivateWorkVersionDto} from '../../shared/contracts';
import type {StudioDraft,StudioWork,StudioAsset,StudioListItem} from './types';
export function createStudioClient(enabled:boolean) {
 const api=createApiClient({getAccessToken:()=>enabled?getAccessToken():Promise.resolve(null)});
 const write=<T,>(path:string,method:string,body:unknown)=>api.request<T>(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.data);
 return {
  image:api.image,
  upload:(id:string,file:Blob,label?:string)=>api.request<StudioAsset>(`/api/studio/works/${id}/images`,{method:'POST',headers:{'Content-Type':'image/png',...(label?{'X-Image-Label':encodeURIComponent(Array.from(label).slice(0,100).join(''))}:{})},body:file}).then(r=>r.data),
  uploadAsset:(id:string,assetId:string,file:Blob)=>api.request<StudioAsset>(`/api/studio/works/${id}/assets/${assetId}/image`,{method:'POST',headers:{'Content-Type':'image/png'},body:file}).then(r=>r.data),
  list:()=>api.request<StudioListItem[]>('/api/studio/works').then(r=>r.data),
  get:(id:string)=>api.request<StudioWork>(`/api/studio/works/${encodeURIComponent(id)}`).then(r=>r.data),
  save:(draft:StudioDraft)=>write<StudioWork>(`/api/studio/works${draft.id?`/${draft.id}`:''}`,draft.id?'PUT':'POST',draft),
  publish:(id:string,revision:number)=>write<PrivateWorkVersionDto>(`/api/studio/works/${id}/publish`,'POST',{revision}),
  asset:(id:string,code:string,label:string)=>write<StudioAsset>(`/api/studio/works/${id}/assets`,'POST',{code,label}),
 };
}
export type StudioClient=ReturnType<typeof createStudioClient>;
