import type {ReactNode} from 'react';
export function CollectionHeading({title,description,eyebrow,children}:{title:string;description?:string;eyebrow?:string;children?:ReactNode}){
 return <header className="collection-heading"><div>{eyebrow&&<span className="collection-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{children}</header>;
}
