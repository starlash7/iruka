type Node={id:string;parentMessageId:string|null};
export function getMessageBranch<T extends Node>(messages:readonly T[],activeId:string|null):T[]{
 const byId=new Map(messages.map(message=>[message.id,message]));const branch:T[]=[];const visited=new Set<string>();
 let id=activeId;
 while(id){if(visited.has(id))throw new Error('대화 분기가 올바르지 않아요.');visited.add(id);
  const message=byId.get(id);if(!message)throw new Error('대화 메시지를 다시 불러와 주세요.');branch.unshift(message);id=message.parentMessageId;}
 return branch;
}
export function getSiblingMessages<T extends Node>(messages:readonly T[],message:T):T[]{return messages.filter(item=>item.parentMessageId===message.parentMessageId);}
