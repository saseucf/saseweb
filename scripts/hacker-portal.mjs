import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { config } from 'dotenv';
const root=fileURLToPath(new URL('..',import.meta.url));
// The separate app can reuse local project configuration without copying secrets.
config({path:resolve(root,'.env.local'),quiet:true});
config({path:resolve(root,'apps/hacker-portal/.env.local'),override:true,quiet:true});
const mode=process.argv[2];
if(!['dev','build','start'].includes(mode))throw new Error('Use dev, build, or start.');
const args=[resolve(root,'node_modules/next/dist/bin/next'),mode,resolve(root,'apps/hacker-portal')];
if(mode!=='build')args.push('-p',process.env.HACKATHON_PORT || '3002','-H','127.0.0.1');
const child=spawn(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS,'--no-experimental-webstorage'].filter(Boolean).join(' ')}});
child.on('exit',code=>{process.exitCode=code ?? 1;});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
