import type {ModelService} from '../core/interfaces.ts';
import {ApiError} from '../core/errors.ts';
import type {ChatPolicy} from '../chat/index.ts';
import type {SafetyService} from '../chat/safety.ts';
import {createOpenAIModel} from './openai.ts';
export interface NamedSafetyPolicy extends SafetyService {id:string}
export interface OpenAIRuntimeOptions {
  apiKey:string;modelId:'gpt-5.4-mini';timeoutMs:number;maxOutputTokens:number;
  policy:ChatPolicy;safety:NamedSafetyPolicy;
  /** Fixture transport injection. Omit only in an explicitly approved live composition. */
  fetch?:typeof globalThis.fetch;
}
export interface OpenAIRuntime {model:ModelService;safety:SafetyService;models:Readonly<Record<string,ChatPolicy>>}
/** Server-only, explicit configuration. Never reads environment or falls back to a test model. */
export function createOpenAIRuntime(options:OpenAIRuntimeOptions):OpenAIRuntime {
  const validInteger=(value:unknown,min:number,max:number)=>Number.isSafeInteger(value)&&(value as number)>=min&&(value as number)<=max;
  const p=options?.policy;
  if(typeof window!=='undefined'||!options||typeof options.apiKey!=='string'||!options.apiKey.trim()||/\s/.test(options.apiKey)||options.modelId!=='gpt-5.4-mini'||
    !validInteger(options.timeoutMs,1,55000)||!validInteger(options.maxOutputTokens,1,128000)||
    !p||!validInteger(p.maxContextTokens,1,400000-options.maxOutputTokens)||!validInteger(p.maxOutputCharacters,1,200000)||
    !validInteger(p.reservedCredits,1,Number.MAX_SAFE_INTEGER)||typeof p.actualCredits!=='function'||
    !options.safety||typeof options.safety.id!=='string'||!options.safety.id.trim()||typeof options.safety.check!=='function'||
    (options.fetch!==undefined&&typeof options.fetch!=='function'))throw new ApiError('SERVICE_UNAVAILABLE','실제 모델과 안전 정책 설정이 필요해요.');
  const policy:ChatPolicy=Object.freeze({...p});
  const safety:SafetyService={check:options.safety.check.bind(options.safety)};
  const model=createOpenAIModel({apiKey:options.apiKey,modelId:options.modelId,timeoutMs:options.timeoutMs,
    maxOutputTokens:options.maxOutputTokens,maxOutputCharacters:p.maxOutputCharacters,safety,fetch:options.fetch??globalThis.fetch});
  return {model,safety,models:Object.freeze({[options.modelId]:policy})};
}
