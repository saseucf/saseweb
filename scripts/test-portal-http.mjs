import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
const base=process.env.PORTAL_TEST_URL || 'http://127.0.0.1:3002';
let landing='';
for(const path of ['/','/login','/apply','/dashboard','/organizer','/auth/callback','/reset-password']){
  const response=await fetch(new URL(path,base)),html=await response.text();
  assert.equal(response.status,200,`${path} should load`);
  assert.ok(html.includes('id="main"'),`${path} must have the accessible main landmark`);
  if(path==='/')landing=html;
  console.log(`PASS HTTP ${path}`);
}
assert.ok(landing.includes('March 6')&&landing.includes('2027'),'Confirmed event dates should render');
assert.ok(landing.includes('February 15, 2027'),'Confirmed RSVP date should render');
assert.ok(landing.includes('mailto:ucfsase.tech@gmail.com'),'Public contact should render');
assert.ok(landing.includes('https://discord.gg/wJvHPkbBN'),'Confirmed Discord invite should render');
console.log('PASS confirmed public event details');

// A public key is expected in browser JS; the service-role key must never appear.
let env={};try{env=parse(await readFile('.env.local'));}catch{/* CI may use environment variables instead. */}
const secret=process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if(secret){
  const directory=resolve('apps/hacker-portal/.next/static');
  for(const name of await readdir(directory,{recursive:true})){
    if(!name.endsWith('.js'))continue;
    assert.equal((await readFile(resolve(directory,name),'utf8')).includes(secret),false,'Server credentials must not be bundled');
  }
  console.log('PASS no service-role credential in browser bundles');
}
