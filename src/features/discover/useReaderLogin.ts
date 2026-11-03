import {useReader} from './ReaderProvider';
import {currentLoginReturn,loginHref} from '../auth/loginRedirect';

// Navigation remounts private views after authentication; restored SDK events cannot reload them.
export function useReaderLogin({next,onError}:{next?:string;onError:()=>void}){
 const {navigate}=useReader();
 return ()=>{try{navigate(loginHref(next??currentLoginReturn()));}catch{onError();}};
}
