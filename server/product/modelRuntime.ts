import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createOpenAIRuntime,type OpenAIRuntimeOptions} from '../models/index.ts';
import {getLocalPolicy} from './localPolicy.ts';
import type {ProductOptions} from './index.ts';

type ModelOptions=Omit<OpenAIRuntimeOptions,'apiKey'|'fetch'>;
type LoadOptions=()=>Promise<{createOptions:()=>ModelOptions|Promise<ModelOptions>}>;
/** Local composition only. No provider is called while loading configuration. */
export async function getLocalModelRuntime(env:NodeJS.ProcessEnv,loadOptions:LoadOptions=()=>import(pathToFileURL(resolve('.context/model-runtime.ts')).href)):Promise<Partial<ProductOptions>>{
 if(env.LOCAL_LIVE_MODEL!=='1')return getLocalPolicy(env);
 if(env.NODE_ENV==='production'||env.VERCEL)throw new Error('LOCAL_LIVE_MODEL is local-only');
 if(env.LOCAL_TEST_CHAT==='1')throw new Error('Choose live model or deterministic test model');
 if(!env.OPENAI_API_KEY?.trim())throw new Error('OPENAI_API_KEY is required for the explicit local runtime');
 try{
  const module=await loadOptions();
  const options=await module.createOptions();
  // Only explicit policy fields are accepted; key/transport cannot come from this module.
  return createOpenAIRuntime({modelId:options.modelId,timeoutMs:options.timeoutMs,maxOutputTokens:options.maxOutputTokens,policy:options.policy,safety:options.safety,apiKey:env.OPENAI_API_KEY});
 }catch{throw new Error('Local model configuration is missing or invalid; configure .context/model-runtime.ts with an explicit safety and credit policy');}
}
