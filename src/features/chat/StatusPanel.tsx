export function parseStatus(text:string){
 const lines=text.split(/\n|\s+·\s+|\s*\|\s*/).map(line=>line.trim()).filter(Boolean);
 const entries=lines.map(line=>{const match=/^([^:：]{1,40})[:：]\s*(.{1,300})$/u.exec(line);return match?{label:match[1].trim(),value:match[2].trim()}:null;});
 return entries.length&&entries.every(Boolean)?entries as Array<{label:string;value:string}>:null;
}
export function StatusPanel({text,open=false}:{text:string;open?:boolean}){const entries=parseStatus(text);return <details className="chat-status" open={open||undefined}><summary>상태창</summary>{entries?<dl>{entries.map((entry,index)=><div key={index}><dt>{entry.label}</dt><dd>{entry.value}</dd></div>)}</dl>:<p>{text}</p>}</details>;}
