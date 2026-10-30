import {useEffect,useState} from 'react';
export function useResource<T>(load:()=>Promise<T>,deps:readonly unknown[]){
 const [state,setState]=useState<{data:T|null;error:Error|null;loading:boolean}>({data:null,error:null,loading:true});const [revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setState({data:null,error:null,loading:true});load().then(data=>{if(active)setState({data,error:null,loading:false});},error=>{if(active)setState({data:null,error:error instanceof Error?error:new Error('불러오지 못했어요.'),loading:false});});return()=>{active=false;};},[...deps,revision]);
 return {...state,reload:()=>setRevision(value=>value+1)};
}
