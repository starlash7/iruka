import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {getAccessToken} from '@privy-io/react-auth';
import {createReaderApi,type ReaderApi} from './readerApi';
export interface ReaderEnvironment {api:ReaderApi;development:boolean;href:(path:string)=>string;navigate:(path:string)=>void}
const Context=createContext<ReaderEnvironment|null>(null);
const api=createReaderApi({getAccessToken:async()=>import.meta.env.VITE_PRIVY_APP_ID?.trim()?getAccessToken():null});
function getReaderHref(path:string){
 if(typeof window==='undefined')return path;
 const network=new URLSearchParams(window.location.search).get('network');
 if(network!=='giwa'&&network!=='monad')return path;
 const url=new URL(path,window.location.origin);url.searchParams.set('network',network);return url.pathname+url.search+url.hash;
}
const production:ReaderEnvironment={api,development:false,href:getReaderHref,navigate:path=>{window.location.assign(getReaderHref(path));}};
export function ReaderProvider({children,api,development=false,href=(path:string)=>path,navigate=(path:string)=>window.location.assign(href(path))}:{children:ReactNode;api:ReaderApi;development?:boolean;href?:(path:string)=>string;navigate?:(path:string)=>void}){
 const value=useMemo(()=>({api,development,href,navigate}),[api,development,href,navigate]);return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useReader(){return useContext(Context)??production;}
