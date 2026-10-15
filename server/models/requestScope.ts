/** Bound each await, including injected transports/policies that ignore AbortSignal. */
export async function awaitWithSignal<T>(pending:Promise<T>,signal:AbortSignal):Promise<T> {
  if(signal.aborted){
    void pending.catch(()=>{});
    throw new DOMException('Request aborted','AbortError');
  }
  let onAbort:()=>void=()=>{};
  const aborted=new Promise<never>((_,reject)=>{onAbort=()=>reject(new DOMException('Request aborted','AbortError'));signal.addEventListener('abort',onAbort,{once:true});});
  try{return await Promise.race([pending,aborted]);}
  finally{signal.removeEventListener('abort',onAbort);}
}
