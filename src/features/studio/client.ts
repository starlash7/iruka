import {getAccessToken} from '@privy-io/react-auth';
import {createApiClient} from '../../shared/apiClient';
import type {PrivateWorkVersionDto} from '../../shared/contracts';
import type {StudioDraft,StudioWork,StudioAsset} from './types';
export function createStudioClient(enabled:boolean) {
 const api=createApiClient({getAccessToken:()=>enabled?getAccessToken():Promise.resolve(null)});
 const write=<T,>(path:string,method:string,body:unknown)=>api.request<T>(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.data);
 return {
  list:()=>api.request<Array<{id:string;title:string;mode:string;published:boolean}>>('/api/studio/works').then(r=>r.data),
  get:(id:string)=>api.request<StudioWork>(`/api/studio/works/${encodeURIComponent(id)}`).then(r=>r.data),
  save:(draft:StudioDraft)=>write<StudioWork>(`/api/studio/works${draft.id?`/${draft.id}`:''}`,draft.id?'PUT':'POST',draft),
  publish:(id:string,revision:number)=>write<PrivateWorkVersionDto>(`/api/studio/works/${id}/publish`,'POST',{revision}),
  asset:(id:string,code:string,label:string)=>write<StudioAsset>(`/api/studio/works/${id}/assets`,'POST',{code,label}),
 };
}
export type StudioClient=ReturnType<typeof createStudioClient>;
