import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {getAccessToken} from '@privy-io/react-auth';
import {createReaderApi,type ReaderApi} from './readerApi';
export interface ReaderEnvironment {api:ReaderApi;development:boolean;href:(path:string)=>string;navigate:(path:string)=>void}
const Context=createContext<ReaderEnvironment|null>(null);
const api=createReaderApi({getAccessToken:async()=>import.meta.env.VITE_PRIVY_APP_ID?.trim()?getAccessToken():null});
const production:ReaderEnvironment={api,development:false,href:path=>path,navigate:path=>{window.location.assign(path);}};
export function ReaderProvider({children,api,development=false,href=(path:string)=>path,navigate=(path:string)=>window.location.assign(href(path))}:{children:ReactNode;api:ReaderApi;development?:boolean;href?:(path:string)=>string;navigate?:(path:string)=>void}){
 const value=useMemo(()=>({api,development,href,navigate}),[api,development,href,navigate]);return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useReader(){return useContext(Context)??production;}
