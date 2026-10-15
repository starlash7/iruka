import {useSyncExternalStore} from 'react';
let busy=false;
const listeners=new Set<()=>void>();
export function setTransferBusy(value:boolean){busy=value;for(const listener of listeners)listener();}
export function useTransferBusy(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener);};},()=>busy,()=>false);}
