import characters from './assets/account-idols-transparent.png';
import ocean from './assets/iruka-entry-sky-ocean.png';
import './reader-identity.css';
import './reader-brand-effects.css';
export function ReaderAvatar({identity}:{identity:string}) {
 const index=Array.from(identity).reduce((sum,char)=>(sum+char.codePointAt(0)!)%4,0);
 return <span aria-hidden="true" className={`reader-profile-avatar reader-profile-avatar-${index}`}/>;
}
export function ReaderAccountArt(){return <div className="reader-account-art" aria-hidden="true"><img className="reader-account-ocean" src={ocean} alt=""/><img className="reader-account-characters" src={characters} alt=""/></div>;}
