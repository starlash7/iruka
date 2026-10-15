import {getAccessToken} from '@privy-io/react-auth';
import {createApiClient} from '../../shared/apiClient';
import type {PrivateWorkVersionDto} from '../../shared/contracts';
import type {StudioDraft,StudioWork,StudioAsset} from './types';
export function createStudioClient(enabled:boolean) {
 const api=createApiClient({getAccessToken:()=>enabled?getAccessToken():Promise.resolve(null)});
 const write=<T,>(path:string,method:string,body:unknown)=>api.request<T>(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.data);
 return {
  async image(url:string){
   if(!/^\/api\/studio\/media\/[0-9a-f-]+\/[0-9a-f]{64}$/.test(url))throw new Error('등록 이미지 주소를 확인해 주세요.');
   const token=enabled?await getAccessToken():null;const response=await fetch(url,{headers:token?{Authorization:`Bearer ${token}`}:{},redirect:'error'});
   if(!response.ok)throw new Error('이미지를 불러오지 못했어요.');return response.blob();
  },
  upload:(id:string,file:Blob)=>api.request<StudioAsset>(`/api/studio/works/${id}/images`,{method:'POST',headers:{'Content-Type':'image/png'},body:file}).then(r=>r.data),
  list:()=>api.request<Array<{id:string;title:string;mode:string;published:boolean}>>('/api/studio/works').then(r=>r.data),
  get:(id:string)=>api.request<StudioWork>(`/api/studio/works/${encodeURIComponent(id)}`).then(r=>r.data),
  save:(draft:StudioDraft)=>write<StudioWork>(`/api/studio/works${draft.id?`/${draft.id}`:''}`,draft.id?'PUT':'POST',draft),
  publish:(id:string,revision:number)=>write<PrivateWorkVersionDto>(`/api/studio/works/${id}/publish`,'POST',{revision}),
  asset:(id:string,code:string,label:string)=>write<StudioAsset>(`/api/studio/works/${id}/assets`,'POST',{code,label}),
 };
}
export type StudioClient=ReturnType<typeof createStudioClient>;
