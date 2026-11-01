export function StateArtwork({kind='stories'}:{kind?:'stories'|'conversations'|'search'}){
 return <img className="state-artwork" src={`/illustrations/empty-${kind}.svg`} alt="" width="180" height="144" aria-hidden="true"/>;
}
