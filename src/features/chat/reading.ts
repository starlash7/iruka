export const readingKey='iruka:reader:reading-v1';
export type Reading={fontSize:number;lineHeight:number};
export const defaultReading:Reading={fontSize:16,lineHeight:1.85};
export function parseReading(value:unknown):Reading{
 if(!value||typeof value!=='object')return {...defaultReading};const input=value as Partial<Reading>;
 return {fontSize:Number.isInteger(input.fontSize)&&Number(input.fontSize)>=14&&Number(input.fontSize)<=24?Number(input.fontSize):16,lineHeight:[1.6,1.85,2.1].includes(Number(input.lineHeight))?Number(input.lineHeight):1.85};
}
export function readReading(storage:Pick<Storage,'getItem'>):Reading{try{return parseReading(JSON.parse(storage.getItem(readingKey)??'null'));}catch{return {...defaultReading};}}
export function saveReading(storage:Pick<Storage,'setItem'>,value:Reading){try{storage.setItem(readingKey,JSON.stringify(parseReading(value)));return true;}catch{return false;}}
export function visibleLine(line:string){const dialogue=/^@([^@\n]{1,50})@\s*(.*)$/.exec(line);return dialogue?`${dialogue[1]} ${dialogue[2]}`:line.startsWith('*')&&line.endsWith('*')?line.slice(1,-1):line;}
export function literalPattern(query:string){return query.trim()?new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'iu'):null;}
export function findMessages<T extends {id:string;content:string}>(messages:T[],query:string){const pattern=literalPattern(query);return pattern?messages.filter(message=>pattern.test(message.content.split('\n').map(visibleLine).join('\n'))).map(message=>message.id):[];}
