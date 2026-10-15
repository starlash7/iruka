export function FooterMascot() {
 return <svg className="footer-mascot" viewBox="0 0 120 130" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id="fm-skin" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stopColor="#E990B4"/><stop offset="1" stopColor="#F8C9DA"/>
   </linearGradient>
  </defs>
  <ellipse cx="58" cy="128" rx="40" ry="3" fill="#684652" opacity=".08"/>
  <g className="fm-body">
   <path d="M30 124C22 96 26 58 52 36C70 21 94 24 104 38C108 44 100 48 92 47C84 47 80 52 80 62C82 84 84 106 88 124Z" fill="url(#fm-skin)"/>
   <path d="M44 124C40 104 44 84 58 74C70 68 78 76 78 90C78 104 80 116 82 124Z" fill="#FFF0F5"/>
   <path d="M60 28C58 14 64 6 74 2C74 12 74 20 72 28Z" fill="#E990B4"/>
   <path d="M104 38C112 40 118 40 120 36C114 44 108 46 100 46Z" fill="#F2B8CE"/>
   <path d="M38 80C28 86 24 96 28 102C36 100 44 92 46 84Z" fill="#E990B4"/>
   <g className="fm-eye"><ellipse cx="82" cy="40" rx="3.2" ry="4" fill="#25232A"/><circle cx="83.2" cy="38.5" r="1.1" fill="#fff"/></g>
   <ellipse cx="74" cy="50" rx="5" ry="3" fill="#F04438" opacity=".18"/>
   <path d="M90 52C94 54 98 54 101 52" fill="none" stroke="#684652" strokeWidth="1.6" strokeLinecap="round"/>
  </g>
  <g className="fm-tail">
   <path d="M86 124C100 122 108 114 106 104C112 108 118 106 120 100C122 112 112 126 92 127Z" fill="#E990B4"/>
  </g>
 </svg>;
}
