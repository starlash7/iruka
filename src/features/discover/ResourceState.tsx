import {Button} from '../../ui';
import {ApiClientError} from '../../shared/apiClient';
import {useReader} from './ReaderProvider';
export function ResourceState({loading,error,retry,empty,loadingText='불러오는 중'}:{loading?:boolean;error?:Error|null;retry?:()=>void;empty?:string;loadingText?:string}){
 const {href}=useReader();
 if(loading)return <div className="reader-state" role="status" aria-live="polite"><span className="reader-spinner"/>{loadingText}</div>;
 if(error)return <div className="reader-state reader-error" role="alert"><p>{error.message}</p>{error instanceof ApiClientError&&error.status===401&&<a href={href('/account')}>로그인</a>}{retry&&<Button variant="secondary" onClick={retry}>다시 시도</Button>}</div>;
 return <div className="reader-state"><p>{empty??'아직 작품이 없어요.'}</p></div>;
}
