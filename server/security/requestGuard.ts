export interface RequestLimits {
 windowMs:number;requests:number;writes:number;concurrentPerClient:number;concurrentTotal:number;clients:number;
}
export const defaultRequestLimits:Readonly<RequestLimits>=Object.freeze({windowMs:60000,requests:120,writes:30,concurrentPerClient:8,concurrentTotal:32,clients:4096});
type Entry={started:number;requests:number;writes:number;active:number};
type Admission={allowed:true;release:()=>void}|{allowed:false;reason:'rate'|'capacity';retryAfter:number};
/** Bounded single-process protection. The caller supplies the socket address, never forwarded headers. */
export function createRequestGuard(overrides:Partial<RequestLimits>={},now=Date.now){
 const limits={...defaultRequestLimits,...overrides};
 if(Object.values(limits).some(value=>!Number.isSafeInteger(value)||value<1))throw new Error('Invalid request limits');
 const entries=new Map<string,Entry>();let active=0;
 return {acquire(client:string,method:string):Admission{
  const time=now();let entry=entries.get(client);
  if(!entry){
   if(entries.size>=limits.clients)for(const [key,value] of entries)if(!value.active&&time-value.started>=limits.windowMs)entries.delete(key);
   if(entries.size>=limits.clients)return {allowed:false,reason:'capacity',retryAfter:Math.ceil(limits.windowMs/1000)};
   entry={started:time,requests:0,writes:0,active:0};entries.set(client,entry);
  }
  if(time-entry.started>=limits.windowMs){entry.started=time;entry.requests=0;entry.writes=0;}
  const write=!['GET','HEAD','OPTIONS'].includes(method);
  if(entry.requests>=limits.requests||(write&&entry.writes>=limits.writes))return {allowed:false,reason:'rate',retryAfter:Math.max(1,Math.ceil((limits.windowMs-time+entry.started)/1000))};
  if(entry.active>=limits.concurrentPerClient||active>=limits.concurrentTotal)return {allowed:false,reason:'capacity',retryAfter:1};
  entry.requests++;if(write)entry.writes++;entry.active++;active++;
  let released=false;
  return {allowed:true,release(){if(!released){released=true;entry!.active--;active--;}}};
 }};
}
