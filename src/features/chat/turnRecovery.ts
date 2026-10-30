import type {TurnRequest} from '../../shared/contracts.ts';
type Attempt={body:TurnRequest;key:string};
/** A history GET cannot prove that an interrupted stream finished. Preserve its key. */
export function createTurnRecovery(){
 let attempt:Attempt|null=null;let needsRefresh=false;
 return {
  get attempt(){return attempt;},get needsRefresh(){return needsRefresh;},get locked(){return attempt!==null||needsRefresh;},
  begin(body:TurnRequest,retry:boolean):Attempt{
   if(retry&&attempt)return attempt;
   if(attempt||needsRefresh)throw new Error('이전 응답을 먼저 확인해 주세요.');
   attempt={body,key:crypto.randomUUID()};return attempt;
  },
  terminal(){attempt=null;needsRefresh=true;},
  rejected(){attempt=null;needsRefresh=false;},
  reconciled(){needsRefresh=false;},
 };
}
