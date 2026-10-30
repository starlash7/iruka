import type {PrivateWorkConfig} from '../../src/shared/contracts.ts';
/** Author-only text must never be returned verbatim by a model. Ending title/text are
 * intentional result content; IDs and image URLs are separately projected/validated. */
export function getPrivateTexts(config:Partial<PrivateWorkConfig>):string[] {
  return [config.systemPrompt??'',config.outputRules??'',config.statusTemplate??'',
    ...config.characterSettings?.flatMap(c=>[c.description,c.speechStyle])??[],
    ...config.examples?.flatMap(e=>[e.user,e.assistant])??[],
    ...config.openingContexts?.map(o=>o.hiddenContext)??[],
    ...config.lorebook?.map(e=>e.content)??[],
    ...config.endings?.map(e=>e.condition)??[]];
}
