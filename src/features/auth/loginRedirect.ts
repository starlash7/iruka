import {matchRoute} from '../../routes/paths';

/** Only application routes and reader context may survive the OAuth round trip. */
export function safeLoginReturn(value:unknown):string {
 if(typeof value!=='string'||value.length>2048||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u0020]/u.test(value))return '/account';
 try{
  const url=new URL(value,'https://iruka.invalid');
  const route=matchRoute(url.pathname);
  if(url.origin!=='https://iruka.invalid'||!route||route.id==='login')return '/account';
  const query=new URLSearchParams();
  for(const key of ['network','q','sort','mode','start','opening']){
   const item=url.searchParams.get(key);if(item!==null)query.set(key,item);
  }
  const hash=/^#[a-z0-9-]+$/i.test(url.hash)?url.hash:'';
  return url.pathname+(query.size?`?${query}`:'')+hash;
 }catch{return '/account';}
}
export function loginHref(next:string):string {return `/login?${new URLSearchParams({next:safeLoginReturn(next)})}`;}
export function currentLoginReturn():string {
 if(typeof window==='undefined')return '/account';
 return safeLoginReturn(window.location.pathname+(window.location.search??'')+(window.location.hash??''));
}
