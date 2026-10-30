import {ApiError} from '../core/errors.ts';
export interface SafetyService {check(text:string, direction:'input'|'output'):Promise<boolean>}
/** Policy is injected; no permissive production default or claim of comprehensive moderation. */
export async function requireSafeText(safety:SafetyService|undefined,text:string,direction:'input'|'output',privateTexts:readonly string[]=[]):Promise<void> {
  if(!safety)throw new ApiError('SERVICE_UNAVAILABLE','안전 정책을 준비 중이에요.');
  const normalized=text.normalize('NFKC').replace(/\s+/g,'').toLowerCase();
  const leaked=direction==='output'&&privateTexts.some(s=>{
    const secret=s.normalize('NFKC').replace(/\s+/g,'').toLowerCase();return secret.length>=8&&normalized.includes(secret);
  });
  if(leaked||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)||/<\/?(?:script|iframe|object|embed)\b/i.test(text)||!await safety.check(text,direction))
    throw new ApiError('FORBIDDEN','안전 기준에 따라 이 내용을 처리할 수 없어요.');
}
