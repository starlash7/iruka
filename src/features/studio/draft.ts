import type { StudioDraft } from './types.ts';
export function makeDraft():StudioDraft {
 return {mode:'story',title:'',description:'',coverUrl:null,tags:[],assets:[],
  publicSnapshot:{tagline:'',playGuide:'',characters:[],openings:[]},
  privateConfig:{systemPrompt:'',outputRules:'',statusTemplate:'',characterSettings:[],examples:[],openingContexts:[],lorebook:[],endings:[]}};
}
