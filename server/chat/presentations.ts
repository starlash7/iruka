import type {Database} from '../db/index.ts';
import type {EventPayload} from './turnLifecycle.ts';
export async function savePresentation(db:Database,messageId:string,events:EventPayload[]) {
  const images=events.flatMap(e=>e.type==='image'?[{url:e.url,alt:e.alt}]:[]);
  const statuses=events.flatMap(e=>e.type==='status'?[e.status]:[]);
  const endings=events.flatMap(e=>e.type==='ending'?[{endingId:e.endingId,title:e.title}]:[]);
  await db.query('INSERT INTO chat_message_presentations(message_id,images,statuses,endings) VALUES($1,$2,$3,$4)',[messageId,JSON.stringify(images),JSON.stringify(statuses),JSON.stringify(endings)]);
}
export async function getPresentations(db:Database,messageIds:string[]) {
  const {rows}=await db.query<{message_id:string;images:Array<{url:string;alt:string}>;statuses:string[];endings:Array<{endingId:string;title:string}>}>(`SELECT * FROM chat_message_presentations WHERE message_id=ANY($1::uuid[])`,[messageIds]);
  return messageIds.flatMap(id=>{
    const row=rows.find(r=>r.message_id===id);if(!row)return [];
    return [{messageId:row.message_id,images:row.images.map(i=>({url:i.url,alt:i.alt})),statuses:row.statuses,endings:row.endings.map(e=>({endingId:e.endingId,title:e.title}))}];
  });
}
