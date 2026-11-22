import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({path:'.env.local',quiet:true});
config({path:'apps/hacker-portal/.env.local',override:true,quiet:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!key){console.log('Supabase public configuration: missing');process.exitCode=1;}
else{
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),db=client.schema('hackathon');
  const configResult=await db.from('portal_configuration').select('account_isolation_ready').eq('id',true).maybeSingle();
  if(configResult.error){console.log(`Hackathon API: unavailable (${configResult.error.code})`);console.log(configResult.error.message);process.exitCode=1;}
  else{
    const slug=process.env.NEXT_PUBLIC_HACKATHON_SLUG||'lumahacks';
    const [event,schools,countries]=await Promise.all([db.from('hackathons').select('id').eq('slug',slug).eq('is_published',true).maybeSingle(),db.from('schools').select('id',{count:'exact',head:true}).eq('is_active',true),db.from('countries').select('code',{count:'exact',head:true})]);
    const terms=event.data ? await db.from('application_terms').select('version').eq('hackathon_id',event.data.id).eq('is_current',true).maybeSingle() : null;
    const checks={api:true,accountIsolation:configResult.data?.account_isolation_ready===true,publishedEvent:!!event.data,schools:!schools.error&&(schools.count||0)>0,countries:!countries.error&&(countries.count||0)>0,currentTerms:!!terms?.data};
    for(const [name,ready] of Object.entries(checks))console.log(`${name}: ${ready?'ready':'not ready'}`);
    if(Object.values(checks).some(v=>!v))process.exitCode=1;
  }
}
