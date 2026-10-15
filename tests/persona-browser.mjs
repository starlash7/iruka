// Run: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/persona-browser.mjs
// HTTP fixture validates UI only, not server mutation support or authentication.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const server=await createServer({server:{port:5197,strictPort:true,host:'127.0.0.1'},plugins:[{name:'persona-test-entry',configureServer(server){server.middlewares.use('/__persona_test',async (_req,res)=>{res.setHeader('content-type','text/html');res.end(await server.transformIndexHtml('/__persona_test', '<html lang="ko"><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script type="module" src="/tests/fixtures/persona-preview.tsx"></script></html>'));});}}]});
await server.listen();await mkdir('.context',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();page.setDefaultTimeout(15000);
let items=[],writes=0,failSave=false,failDelete=false,failList=true;
const errors=[];page.on('pageerror',error=>(errors.push(error.message),console.error(error.message)));
await page.route('**/api/me/personas**',async route=>{
 const method=route.request().method();
 if(method==='GET'&&failList){failList=false;return route.fulfill({status:503,json:{error:{code:'SERVICE_UNAVAILABLE',message:'test failure'},requestId:'test'}});}
 if(method==='GET')return route.fulfill({json:{data:items,requestId:'test'}});
 writes++;await new Promise(resolve=>setTimeout(resolve,250));
 if((method==='DELETE'&&failDelete)||(method!=='DELETE'&&failSave))return route.fulfill({status:503,json:{error:{code:'SERVICE_UNAVAILABLE',message:'test failure'},requestId:'test'}});
 const id=route.request().url().split('/').at(-1);
 if(method==='DELETE'){items=items.filter(item=>item.id!==id);return route.fulfill({json:{data:null,requestId:'test'}});}
 const body=route.request().postDataJSON();
 const saved={...body,id:method==='POST'?'persona-1':id,userId:'test',createdAt:'2026-10-15T00:00:00Z'};
 items=method==='POST'?[...items,saved]:items.map(item=>item.id===id?saved:item);
 return route.fulfill({json:{data:saved,requestId:'test'}});
});
try{
 await page.goto('http://127.0.0.1:5197/__persona_test');
 await page.getByRole('button',{name:'다시 시도',exact:true}).click();
 await page.getByText('아직 페르소나가 없어요.').waitFor();
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:950});
  await page.getByRole('button',{name:'새 페르소나',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('이름',{exact:true}).fill('   ');
  await dialog.getByRole('button',{name:'저장',exact:true}).click();
  await dialog.getByRole('alert').waitFor();assert.equal(writes,0);
  await dialog.getByLabel('이름',{exact:true}).fill('별'.repeat(50));
  await dialog.getByLabel('소개',{exact:true}).fill('긴 소개를 작성한 여행자예요. '.repeat(20));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await dialog.getByLabel('이름',{exact:true}).focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.tagName),'TEXTAREA');
  for(let i=0;i<8;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement===document.body || !!document.activeElement.closest('dialog')),true);}
  await page.screenshot({path:`.context/persona-form-${width}.png`,fullPage:true});
  await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 }
 await page.getByRole('button',{name:'새 페르소나',exact:true}).click();
 await page.getByLabel('이름',{exact:true}).fill('별');await page.getByLabel('소개',{exact:true}).fill('여행자');
 failSave=true;await page.getByRole('button',{name:'저장',exact:true}).click();await page.getByRole('alert').waitFor();
 assert.equal(await page.getByLabel('이름',{exact:true}).inputValue(),'별');
 failSave=false;
 await page.getByRole('button',{name:'저장',exact:true}).evaluate(button=>{button.click();button.click();});
 await page.getByRole('heading',{name:'별',exact:true}).waitFor();assert.equal(writes,2);
 await page.getByRole('button',{name:'별 수정',exact:true}).click();
 await page.getByLabel('이름',{exact:true}).fill('달'.repeat(50));
 await page.getByRole('button',{name:'저장',exact:true}).click();
 await page.getByRole('heading',{name:'달'.repeat(50),exact:true}).waitFor();
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`.context/persona-list-${width}.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'달'.repeat(50)+' 삭제',exact:true}).click();
 await page.getByRole('button',{name:'취소',exact:true}).click();assert.equal(items.length,1);
 await page.getByRole('button',{name:'달'.repeat(50)+' 삭제',exact:true}).click();
 failDelete=true;await page.getByRole('button',{name:'삭제',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(items.length,1);
 failDelete=false;await page.getByRole('button',{name:'삭제',exact:true}).click();await page.getByText('아직 페르소나가 없어요.').waitFor();
 await page.waitForFunction(()=>document.activeElement.textContent==='새 페르소나');assert.deepEqual(errors,[]);
 console.log('PASS fixture CRUD, invalid input, list/save/delete failures, duplicate submit, cancel, keyboard focus, 390/768/1440 overflow; no runtime errors');
}finally{await browser.close();await server.close();}
