/** Converts syntax only; never guesses an unresolved asset identity. */
export function importText(source:string,aliases:Record<string,string>={}) {
 let changed=0;
 let text=source.replace(/(?<!\{)\{(user|char)\}(?!\})|<(user|char)>/g,(_m,a,b)=>{changed++;return `{{${a??b}}}`;});
 text=text.replace(/\{\{img::([^}]+)\}\}|\{\{image:([^}]+)\}\}|img:\[([^\]]+)\]|\{bg::([^}]+)\}|\{\{(?:url|iurl)\}\}([^\s{}]+\.(?:webp|png|jpg))/g,(whole,...args)=>{
  const original=args.slice(0,5).find(v=>typeof v==='string') as string;
  const code=aliases[original]??original;
  if(!/^[A-Za-z0-9_-]{1,64}$/.test(code))return whole;
  changed++;return `{{img:${code}}}`;
 });
 const unknown=[...text.matchAll(/\{\{[^}]+\}\}|\{bg::[^}]*\}|img:\[[^\]]*\]/g)].map(m=>m[0]).filter(v=>!/^\{\{(?:(?:user|char)|img:[A-Za-z0-9_-]{1,64}|ending:[A-Za-z0-9_-]+)\}\}$/.test(v));
 return {text,changed,unknown:[...new Set(unknown)]};
}
