import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfigFromFile } from 'vite';
import { readFile } from 'node:fs/promises';

const evidence=JSON.parse(await readFile(new URL('../docs/evidence/monad-testnet.json',import.meta.url),'utf8'));
const vercelConfig=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));

async function withEnvironment(overrides,run){
  const values={IRUKA_RELEASE_VALIDATE:'1',VERCEL_ENV:'',VITE_IRUKA_DEPLOYMENT:'monad',
    VITE_MONAD_PACK_BATCH_ADDRESS:evidence.contract,VITE_MONAD_RPC_URL:'',VITE_GIWA_RPC_URL:'',...overrides};
  const previous=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]));
  Object.assign(process.env,values);
  try{return await run();}finally{
    for(const [key,value]of Object.entries(previous)){
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  }
}
const loadBuild=()=>loadConfigFromFile({command:'build',mode:'production'});

test('build configuration rejects an unknown deployment before emitting assets', async () => {
  const previous = process.env.VITE_IRUKA_DEPLOYMENT;
  process.env.VITE_IRUKA_DEPLOYMENT = 'unknown';
  try {
    await assert.rejects(loadConfigFromFile({command: 'build', mode: 'production'}), /Unknown Iruka deployment/);
  } finally {
    if (previous === undefined) delete process.env.VITE_IRUKA_DEPLOYMENT;
    else process.env.VITE_IRUKA_DEPLOYMENT = previous;
  }
});

for(const address of ['', 'not-an-address','0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000002']){
  test(`release build rejects missing/invalid/different Monad deployment: ${address}`,async()=>{
    await withEnvironment({VITE_MONAD_PACK_BATCH_ADDRESS:address},async()=>{
      await assert.rejects(loadBuild(),/Monad.*(?:contract|address|deployment)/i);
    });
  });
}

test('evidenced release configuration passes',async()=>{
  await withEnvironment({},async()=>assert.ok(await loadBuild()));
});

test('Vercel production validates Monad even with a GIWA default',async()=>{
  await withEnvironment({IRUKA_RELEASE_VALIDATE:'',VERCEL_ENV:'production',VITE_IRUKA_DEPLOYMENT:'giwa',VITE_MONAD_PACK_BATCH_ADDRESS:''},async()=>{
    await assert.rejects(loadBuild(),/Monad.*(?:contract|address|deployment)/i);
  });
});

test('ordinary missing-address builds retain the disabled Pull configuration',async()=>{
  await withEnvironment({IRUKA_RELEASE_VALIDATE:'',VITE_MONAD_PACK_BATCH_ADDRESS:''},async()=>assert.ok(await loadBuild()));
});

for(const key of ['VITE_MONAD_RPC_URL','VITE_GIWA_RPC_URL']){
  test(`release build rejects a CSP-blocked ${key}`,async()=>{
    await withEnvironment({[key]:'https://custom-rpc.example/v1'},async()=>{
      await assert.rejects(loadBuild(),/CSP|connect-src/i);
    });
  });
}

for(const url of ['http://testnet-rpc.monad.xyz','not-a-url']){
  test(`release build rejects an unusable RPC URL: ${url}`,async()=>{
    await withEnvironment({VITE_MONAD_RPC_URL:url},async()=>{
      await assert.rejects(loadBuild(),/RPC|HTTPS/i);
    });
  });
}

test('an explicitly allowed custom HTTPS RPC passes the release gate',async()=>{
  const config=structuredClone(vercelConfig);
  const csp=config.headers.find(entry=>entry.source==='/(.*)').headers.find(header=>header.key==='Content-Security-Policy');
  csp.value=csp.value.replace('connect-src ', 'connect-src https://custom-rpc.example ');
  const {validateReleaseConfig}=await import('../vite.config.ts');
  assert.doesNotThrow(()=>validateReleaseConfig({VITE_MONAD_PACK_BATCH_ADDRESS:evidence.contract,VITE_MONAD_RPC_URL:'https://custom-rpc.example/v1'},evidence,config));
});

test('CI enables release validation and derives its contract from public evidence',async()=>{
  const workflow=await readFile(new URL('../.github/workflows/verify.yml',import.meta.url),'utf8');
  const monadBuild=workflow.slice(workflow.indexOf('- name: Monad configuration build'),workflow.indexOf('\n  contracts:'));
  assert.match(monadBuild,/IRUKA_RELEASE_VALIDATE:\s*["']?1/);
  assert.match(monadBuild,/VITE_MONAD_PACK_BATCH_ADDRESS=.*monad-testnet\.json.*contract/);
});
