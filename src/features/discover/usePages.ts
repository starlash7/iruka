import {useEffect,useRef,useState} from 'react';

/** Offset counts server rows, even when a page overlaps an earlier page. */
export function usePages<T>(load:(offset:number)=>Promise<T[]>,deps:readonly unknown[],size:number,id:(item:T)=>string){
 const [state,setState]=useState<{data:T[]|null;loading:boolean;loadingMore:boolean;error:Error|null;moreError:Error|null;hasMore:boolean}>({data:null,loading:true,loadingMore:false,error:null,moreError:null,hasMore:false});
 const [revision,setRevision]=useState(0);const generation=useRef(0),offset=useRef(0),locked=useRef(false);
 const asError=(error:unknown)=>error instanceof Error?error:new Error('불러오지 못했어요.');
 useEffect(()=>{const token=++generation.current;locked.current=true;offset.current=0;
  setState({data:null,loading:true,loadingMore:false,error:null,moreError:null,hasMore:false});
  load(0).then(data=>{if(token!==generation.current)return;offset.current=data.length;setState({data:dedupe([],data),loading:false,loadingMore:false,error:null,moreError:null,hasMore:data.length===size});},error=>{if(token===generation.current)setState({data:null,loading:false,loadingMore:false,error:asError(error),moreError:null,hasMore:false});}).finally(()=>{if(token===generation.current)locked.current=false;});
  return()=>{generation.current++;};
 },[...deps,revision]);
 function dedupe(current:T[],next:T[]){const seen=new Set(current.map(id));return [...current,...next.filter(item=>{const key=id(item);if(seen.has(key))return false;seen.add(key);return true;})];}
 async function loadMore(){if(locked.current||!state.hasMore)return;locked.current=true;const token=generation.current;setState(value=>({...value,loadingMore:true,moreError:null}));
  try{const next=await load(offset.current);if(token!==generation.current)return;offset.current+=next.length;setState(value=>({...value,data:dedupe(value.data??[],next),loadingMore:false,hasMore:next.length===size&&offset.current<=10000}));}
  catch(error){if(token===generation.current)setState(value=>({...value,loadingMore:false,moreError:asError(error)}));}
  finally{if(token===generation.current)locked.current=false;}
 }
 return {...state,loadMore,reload:()=>setRevision(value=>value+1)};
}
