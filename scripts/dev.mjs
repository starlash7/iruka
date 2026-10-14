import {spawn} from 'node:child_process';
const children=[spawn(process.execPath,['--env-file-if-exists=.env.local','--experimental-strip-types','server/dev.ts'],{stdio:'inherit'}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{stdio:'inherit'})];
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');process.exitCode=code;}
for(const child of children){child.on('error',()=>stop(1));child.on('exit',code=>stop(code??1));}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
