import {TestModelService} from '../core/testAdapters.ts';
import type {ProductOptions} from './index.ts';

/** Explicit local fixture only. Does not enable mock authentication or call a provider. */
export function getLocalPolicy(env:NodeJS.ProcessEnv):Partial<ProductOptions> {
 if(env.LOCAL_TEST_CHAT!=='1')return {};
 if(env.NODE_ENV==='production'||env.VERCEL)throw new Error('LOCAL_TEST_CHAT is local-only');
 return {
  model:new TestModelService(['창가의 빛을 바라보던 상대가 당신에게 고개를 돌립니다.\n"그 이야기를 조금 더 들려줄래요?"'],{inputTokens:32,outputTokens:24}),
  // Only the deterministic local response is enabled. This is not production moderation.
  safety:{async check(text){return !/(?:성행위|강간|아동\s*성착취)/u.test(text);}},
  models:{test:{maxContextTokens:16000,maxOutputCharacters:4000,reservedCredits:1,actualCredits:()=>1}},
  testGrant:{amount:100,key:'local-integration-v1'},
 };
}
