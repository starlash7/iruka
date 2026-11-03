import {useState} from 'react';
import {Button} from '../../ui';
import {defaultReading,saveReading,type Reading} from './reading';
export function ReadingSettings({value,onChange}:{value:Reading;onChange:(value:Reading)=>void}){
 const [notice,setNotice]=useState('');
 function update(next:Reading){onChange(next);try{setNotice(saveReading(window.localStorage,next)?'이 기기에 저장했어요.':'이 기기에 저장할 수 없어 이번 화면에만 적용해요.');}catch{setNotice('이 기기에 저장할 수 없어 이번 화면에만 적용해요.');}}
 return <details className="chat-reading" open><summary>읽기 설정</summary><label className="reader-field">글자 크기 · {value.fontSize}px<input type="range" min="14" max="24" step="1" value={value.fontSize} onChange={event=>update({...value,fontSize:Number(event.target.value)})}/></label><label className="reader-field">줄 간격<select value={value.lineHeight} onChange={event=>update({...value,lineHeight:Number(event.target.value)})}><option value={1.6}>좁게</option><option value={1.85}>기본</option><option value={2.1}>넓게</option></select></label><Button variant="ghost" onClick={()=>update({...defaultReading})}>기본값으로</Button><p role="status">{notice}</p></details>;
}
