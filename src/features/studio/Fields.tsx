import {useId} from 'react';
import {Button,Input} from '../../ui';
import type {ReactNode} from 'react';
export function Text({label,value,max=1000,onChange,field}:{label:string;value:string;max?:number;onChange:(value:string)=>void;field?:string}) {
 const id=useId();return <div className="studio-field"><label htmlFor={id}>{label}</label><textarea id={id} data-editor-field={field} aria-describedby={`${id}-count`} value={value} maxLength={max} onChange={e=>onChange(e.target.value)}/><small id={`${id}-count`}>{value.length} / {max}</small></div>;
}
export function Line({label,value,max=60,onChange,field}:{label:string;value:string;max?:number;onChange:(value:string)=>void;field?:string}) {return <Input label={label} data-editor-field={field} hint={`${value.length} / ${max}`} value={value} maxLength={max} onChange={e=>onChange(e.target.value)}/>;}
export function Group({title,children,onRemove}:{title:string;children:ReactNode;onRemove:()=>void}) {return <section className="studio-group"><div className="studio-toolbar"><h3>{title}</h3><Button variant="ghost" onClick={onRemove}>삭제</Button></div>{children}</section>;}
export function Check({label,value,onChange}:{label:string;value:boolean;onChange:(value:boolean)=>void}) {return <label className="studio-check"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/>{label}</label>;}
