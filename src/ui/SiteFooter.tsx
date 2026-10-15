import {useReader} from '../features/discover/ReaderProvider';
import './site-footer.css';
import {FooterMascot} from './FooterMascot';

export function SiteFooter() {
 const {href}=useReader();
 return <footer className="site-footer">
  <FooterMascot/>
  <div className="footer-brand">
   <a className="footer-brand-link" href={href('/')} aria-label="Iruka 홈">
    <img src="/brand/iruka-logomark.svg" alt="" width="36" height="36"/>
    <img className="footer-wordmark" src="/brand/iruka-wordmark.png" alt="Iruka" width="108" height="34"/>
   </a>
   <p>2026 Iruka Labs, Inc. All rights reserved.</p>
  </div>
  <nav className="footer-column" aria-label="서비스">
   <h2>Platform</h2>
   <a href={href('/')}>작품 탐색</a><a href={href('/studio')}>작품 만들기</a><a href={href('/chats')}>내 대화</a>
  </nav>
  <nav className="footer-column" aria-label="브랜드 자료">
   <h2>Explore</h2>
   <a href="/#brand-kit">Brand Kit</a>
   <a href="https://docs.playiruka.space/overview" target="_blank" rel="noreferrer">Documentation</a>
  </nav>
  <nav className="footer-column" aria-label="문의">
   <h2>Support</h2><a href="mailto:hello@playiruka.space">Contact us</a>
  </nav>
 </footer>;
}
