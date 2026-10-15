import sprite from './iruka-reader.png';

/* Silver-bob idol from account-idols-transparent.png (account/login art), cropped and
   downsampled to a 50x95 pixel grid; book, hands and page-turn are drawn as pixel rects. */
export function FooterReader() {
 return <svg className="footer-reader" viewBox="0 0 50 95" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
  <g className="fr-body"><image href={sprite} width="50" height="95" style={{imageRendering:'pixelated'}}/></g>
  <rect x="6" y="67" width="38" height="24" fill="#7C6A9E"/>
  <rect x="8" y="68" width="17" height="21" fill="#FBF8FF"/>
  <rect x="25" y="68" width="1" height="21" fill="#CFC3E3"/>
  <rect x="26" y="68" width="16" height="21" fill="#F3EEFA"/>
  <g fill="#D9CFEA"><rect x="10" y="72" width="12" height="1"/><rect x="10" y="75" width="10" height="1"/><rect x="10" y="78" width="12" height="1"/><rect x="10" y="81" width="8" height="1"/>
   <rect x="28" y="72" width="11" height="1"/><rect x="28" y="75" width="12" height="1"/><rect x="28" y="78" width="9" height="1"/></g>
  <rect className="fr-page" x="26" y="68" width="16" height="21" fill="#FFFFFF" stroke="#CFC3E3" strokeWidth="1"/>
  <g fill="#F6C3A8"><rect x="4" y="76" width="4" height="5"/><rect x="42" y="76" width="4" height="5"/></g>
  <g fill="#E8A98C"><rect x="4" y="80" width="4" height="1"/><rect x="42" y="80" width="4" height="1"/></g>
 </svg>;
}
