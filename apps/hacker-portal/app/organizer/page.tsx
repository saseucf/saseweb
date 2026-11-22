"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { External, Gate, Notice, usePortal } from "../../components/shared";
import { hackathonApi } from "../../../../lib/hackathon/api";
import { qrToken, type Application, type ScheduleEvent } from "../../../../lib/hackathon/portal";
const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then(m => m.Scanner), { ssr: false });
export default function OrganizerPage() { return <Gate><StaffPortal /></Gate>; }
function StaffPortal() {
  const { client, landing, user } = usePortal();
  const [role, setRole] = useState<string | null>(null), [loading, setLoading] = useState(true), [section, setSection] = useState("Applications");
  useEffect(() => {
    if (!client) return; let active=true;
    const load = async () => { const {data}=await client.schema("hackathon").from("hackathon_staff").select("role").eq("hackathon_id",landing!.event.id).eq("user_id",user!.id).maybeSingle(); if (active) { setRole(data?.role ?? null); setLoading(false); } };
    void load(); const timer=setInterval(() => void load(),30000); return () => { active=false; clearInterval(timer); };
  }, [client, landing, user]);
  if (loading) return <div className="page"><Notice>Checking organizer access…</Notice></div>;
  if (!role) return <div className="page narrow"><h1>Organizer access.</h1><Notice>This account hasn’t been assigned an event staff role. Ask an organizer to grant access if you’re helping run the event.</Notice></div>;
  if (role === "mentor") return <div className="page narrow"><h1>Welcome, mentor.</h1><p>Your mentor role is active. Check the hacker guide for mentoring information, or contact the organizers for your assignment.</p><External className="button" href={landing!.event.guide_url}>Open hacker guide</External></div>;
  return <div className="page"><p className="eyebrow">Behind the bright ideas</p><h1>Organizer desk.</h1><nav className="tabs" aria-label="Organizer tools">{(role === "admin" ? ["Applications","Check-in","Event content"] : ["Check-in"]).map(s => <button key={s} onClick={() => setSection(s)} aria-current={section===s ? "page" : undefined}>{s}</button>)}</nav>{role === "admin" && section === "Applications" ? <Applications /> : role === "admin" && section === "Event content" ? <ContentEditor /> : <Checkin />}</div>;
}
function Applications() {
  const {client,landing}=usePortal();
  const [rows,setRows]=useState<Application[]>([]),[status,setStatus]=useState("applied"),[page,setPage]=useState(0),[total,setTotal]=useState(0),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  const [resume,setResume]=useState<string | null>(null);
  async function load() {
    let query=client!.schema("hackathon").from("applications").select("id,user_id,first_name,last_name,email,phone,shirt_size,dietary_restrictions,resume_path,status",{count:"exact"}).eq("hackathon_id",landing!.event.id).order("created_at");
    if (status!=="all") query=query.eq("status",status);
    const {data,error,count}=await query.range(page*30,page*30+29);
    if (error) { setRows([]); setError("Couldn’t load applications. Check your organizer permissions and retry."); }
    else { setRows(data as Application[]); setTotal(count ?? 0); setError(""); }
  }
  useEffect(() => { void load(); }, [client,landing?.event.id,status,page]); // eslint-disable-line react-hooks/exhaustive-deps
  async function decide(id:string,decision:"accepted"|"waitlisted"|"rejected") {
    if (busy) return;setBusy(true);setNotice("");
    try { await hackathonApi(client!).setStatus(id,decision); await load(); setNotice(`Application marked ${decision}.`); }
    catch (e) {setError(e instanceof Error ? e.message : "The decision couldn’t be saved.");}finally{setBusy(false);}
  }
  return <section className="panel"><div className="section-heading"><div><h2>Application review.</h2><p>{total} applications in this view</p></div><label>Status<select value={status} onChange={e=>{setStatus(e.target.value);setPage(0);}}>{["applied","accepted","waitlisted","rejected","confirmed","withdrawn","all"].map(s=><option key={s}>{s}</option>)}</select></label></div>{error&&<Notice error>{error}</Notice>}{notice&&<Notice>{notice}</Notice>}{resume&&<External className="button secondary" href={resume}>Open resume (link valid for 60 seconds)</External>}<div className="application-list">{rows.map(a=><article key={a.id}><div><h3>{a.first_name} {a.last_name}</h3><a href={`mailto:${a.email}`}>{a.email}</a><p><span className="status">{a.status}</span> · Shirt: {a.shirt_size || "Not specified"}</p><details><summary>Contact & logistics</summary><p>{a.phone}</p><p className="preserve">{a.dietary_restrictions || "No dietary restrictions provided."}</p>{a.resume_path&&<button className="text-button" onClick={()=>{void hackathonApi(client!).resumeDownload(a.resume_path!).then(r=>{if (!r?.signedUrl) throw new Error("Resume unavailable");setResume(r.signedUrl);}).catch(()=>setError("Couldn’t open this resume."));}}>Get resume link</button>}</details></div>{["applied","accepted","waitlisted","rejected"].includes(a.status)&&<div className="inline-actions">{(["accepted","waitlisted","rejected"] as const).map(s=><button className="button small secondary" key={s} disabled={busy||a.status===s} onClick={()=>void decide(a.id,s)}>{s === "accepted" ? "Accept" : s === "waitlisted" ? "Waitlist" : "Reject"}</button>)}</div>}</article>)}</div>{!rows.length&&<p className="empty">No applications in this view.</p>}<div className="inline-actions"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*30>=total} onClick={()=>setPage(p=>p+1)}>Next</button><button onClick={()=>void load()}>Refresh</button></div></section>;
}
function Checkin() {
  const {client,landing}=usePortal(); const lock=useRef(false), last=useRef({token:"",at:0});
  const [events,setEvents]=useState<ScheduleEvent[]>([]),[event,setEvent]=useState(""),[camera,setCamera]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  useEffect(()=>{void client!.schema("hackathon").from("schedule_events").select("*").eq("hackathon_id",landing!.event.id).eq("requires_checkin",true).eq("is_published",true).order("starts_at").then(({data})=>setEvents(data || []));},[client,landing]);
  async function scan(value:string) {
    const token=qrToken(value);
    if (!token) {setError("That isn’t a valid hacker QR code.");return;}
    if (lock.current || (last.current.token===`${event}:${token}` && Date.now()-last.current.at<5000)) return;
    lock.current=true;setError("");setNotice("");
    try {await hackathonApi(client!).scan(landing!.event.id,token,event||null);last.current={token:`${event}:${token}`,at:Date.now()};setNotice("Check-in recorded. A repeated scan won’t create a duplicate.");}
    catch(e){setError(e instanceof Error ? e.message : "Check-in couldn’t be recorded.");}
    finally{lock.current=false;}
  }
  return <section className="panel scan-panel"><p className="eyebrow">A warm welcome starts here</p><h2>Hacker check-in.</h2><label>Check-in destination<select value={event} onChange={e=>{setEvent(e.target.value);setNotice("");}}><option value="">General admission</option>{events.map(e=><option value={e.id} key={e.id}>{e.title}</option>)}</select></label>{error&&<Notice error>{error}</Notice>}{notice&&<Notice>{notice}</Notice>}<button className="button" onClick={()=>setCamera(c=>!c)}>{camera ? "Stop camera" : "Start QR camera"}</button>{camera&&<div className="camera"><Scanner onScan={result=>{if(result[0])void scan(result[0].rawValue);}} onError={()=>setError("Camera access is unavailable. Allow camera permission or enter the code below.")} /></div>}<form onSubmit={e=>{e.preventDefault();void scan(String(new FormData(e.currentTarget).get("token")));}}><label>Or enter a hacker’s QR token<input name="token" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" required /></label><button className="button secondary">Record check-in</button></form></section>;
}
type Field = { key:string; label:string; type?:"textarea"|"number"|"checkbox"|"datetime-local"|"select"|"lines"; required?:boolean; options?:string[]; source?:string };
const field=(key:string,label:string,type?:Field["type"],required=false,options?:string[],source?:string):Field=>({key,label,type,required,options,source});
const content:Record<string,{label:string;fields:Field[]}>= {
  hackathons:{label:"Event details",fields:[field("name","Event name",undefined,true),field("description","About the event","textarea"),field("timezone","Display timezone (for example America/New_York)",undefined,true),...[["starts_at","Event starts"],["ends_at","Event ends"],["hacking_starts_at","Hacking starts"],["hacking_ends_at","Hacking ends"],["applications_open_at","Applications open"],["applications_close_at","Applications close"],["rsvp_deadline","RSVP deadline"]].map(([k,l])=>field(k,l,"datetime-local",true)),field("venue_name","Venue name",undefined,true),field("venue_address","Address",undefined,true),field("parking_info","Parking & arrival","textarea"),field("contact_email","Contact email",undefined,true),field("guide_url","Hacker guide URL"),field("discord_url","Discord URL"),field("devpost_url","Devpost URL"),field("is_published","Publish event","checkbox")]},
  schedule_events:{label:"Schedule",fields:[field("title","Title",undefined,true),field("description","Description","textarea"),field("category","Category","select",true,["ceremony","workshop","food","mini_event","deadline"]),field("starts_at","Starts","datetime-local",true),field("ends_at","Ends","datetime-local",true),field("location_id","Room","select",false,undefined,"locations"),field("host_name","Host"),field("requires_checkin","Accept QR check-ins","checkbox"),field("is_published","Publish","checkbox")]},
  announcements:{label:"Announcements",fields:[field("title","Title",undefined,true),field("body","Message","textarea",true),field("priority","Priority","select",true,["info","urgent"]),field("is_published","Publish","checkbox")]},
  faqs:{label:"FAQ",fields:[field("question","Question",undefined,true),field("answer","Answer","textarea",true),field("display_order","Display order","number"),field("is_published","Publish","checkbox")]},
  sponsors:{label:"Sponsors & partners",fields:[field("name","Name",undefined,true),field("tier","Tier",undefined,true),field("logo_url","Logo URL"),field("website_url","Website URL"),field("is_partner","Partner","checkbox"),field("display_order","Display order","number"),field("is_published","Publish","checkbox")]},
  tracks:{label:"Tracks & prizes",fields:[field("name","Track name",undefined,true),field("description","Description","textarea"),field("sponsor_id","Sponsor","select",false,undefined,"sponsors"),field("prizes","Prizes (one per line)","lines"),field("resources_url","Resources URL"),field("is_published","Publish","checkbox")]},
  perks:{label:"Sponsor perks",fields:[field("title","Title",undefined,true),field("sponsor_id","Sponsor","select",false,undefined,"sponsors"),field("instructions","Redemption instructions","textarea",true),field("redeem_code","Participant redemption code"),field("redeem_url","Redemption URL"),field("unlock_at","Unlock time","datetime-local",true),field("is_published","Publish","checkbox")]},
  hacker_resources:{label:"Wi-Fi",fields:[field("wifi_ssid","Network name"),field("wifi_password","Wi-Fi password"),field("wifi_instructions","Instructions","textarea"),field("unlock_at","Unlock time","datetime-local",true)]},
  map_floors:{label:"Floor plans",fields:[field("building_name","Building",undefined,true),field("floor_label","Floor",undefined,true),field("image_url","Floor plan image URL",undefined,true),field("is_published","Publish","checkbox")]},
  locations:{label:"Rooms & map pins",fields:[field("floor_id","Floor","select",true,undefined,"map_floors"),field("room_name","Room name",undefined,true),field("zone_type","Room type","select",true,["hacking","workshop","food","sleeping","restroom","help_desk","other"]),field("coord_x","Horizontal pin position (0–100%)","number",true),field("coord_y","Vertical pin position (0–100%)","number",true),field("is_published","Publish","checkbox")]},
};
type RecordData=Record<string,unknown>;
function ContentEditor() {
  const {client,landing,refresh}=usePortal();
  const [table,setTable]=useState("hackathons"),[records,setRecords]=useState<RecordData[]>([]),[selected,setSelected]=useState(""),[sources,setSources]=useState<Record<string,RecordData[]>>({}),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  const singleton=["hackathons","hacker_resources"].includes(table), current=records.find(r=>String(r.id || r.hackathon_id)===selected) || (singleton ? records[0] : undefined);
  async function load() {
    const db=client!.schema("hackathon");
    const query=db.from(table).select("*").eq(table === "hackathons" ? "id" : "hackathon_id",landing!.event.id);
    const {data,error}=await query;
    if(error){setError("Couldn’t load event content. Please retry.");setRecords([]);}else setRecords(data||[]);
    const entries=await Promise.all(["locations","sponsors","map_floors"].map(async t=>[t,(await db.from(t).select("*").eq("hackathon_id",landing!.event.id)).data || []] as const));
    setSources(Object.fromEntries(entries));
  }
  useEffect(()=>{setRecords([]);setSelected("");setError("");setNotice("");void load();},[table,client,landing?.event.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setError("");setNotice("");
    const form=new FormData(e.currentTarget),payload:RecordData={};
    for(const f of content[table].fields){const value=String(form.get(f.key)||"");payload[f.key]=f.type === "checkbox" ? form.has(f.key) : f.type === "number" ? Number(value||0) : f.type === "lines" ? value.split("\n").map(v=>v.trim()).filter(Boolean) : f.type === "datetime-local" ? new Date(value).toISOString() : value || (f.source ? null : "");}
    try {
      const db=client!.schema("hackathon");
      const request=current ? db.from(table).update(payload).eq(table === "hacker_resources" ? "hackathon_id" : "id",String(current.id || current.hackathon_id)).select("*") : db.from(table).insert({...payload,hackathon_id:landing!.event.id}).select("*");
      const {data,error}=await request.single();if(error)throw error;
      await load();setSelected(String(data.id || data.hackathon_id));await refresh();setNotice("Event content saved.");
    }catch(e){setError(e instanceof Error ? e.message : "Couldn’t save this content. Check the fields and try again.");}finally{setBusy(false);}
  }
  function value(f:Field) {
    const v=current?.[f.key];
    if(f.type==="datetime-local"&&typeof v==="string"){const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
    if(f.type==="lines")return Array.isArray(v)?v.map(p=>typeof p==="string"?p:typeof p==="object"&&p&&"title" in p?String(p.title):JSON.stringify(p)).join("\n"):"";
    return typeof v === "string" || typeof v === "number" ? v : "";
  }
  return <section className="panel"><h2>Keep the event in sync.</h2><div className="form-grid"><label>Content<select value={table} onChange={e=>setTable(e.target.value)}>{Object.entries(content).map(([t,c])=><option value={t} key={t}>{c.label}</option>)}</select></label>{!singleton&&<label>Entry<select value={selected} onChange={e=>{setSelected(e.target.value);setNotice("");}}><option value="">Create new entry</option>{records.map(r=><option key={String(r.id)} value={String(r.id)}>{String(r.title||r.name||r.question||r.room_name||r.floor_label||r.id)}</option>)}</select></label>}</div>{error&&<Notice error>{error}</Notice>}{notice&&<Notice>{notice}</Notice>}<p className="muted">Date fields use your device’s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Publishing makes content visible to attendees.</p><form key={`${table}:${selected}:${String(current?.id||current?.hackathon_id||"")}`} onSubmit={save}><fieldset disabled={busy}><legend>{content[table].label}</legend><div className="form-grid">{content[table].fields.map(f=><label key={f.key} className={f.type==="checkbox"?"check":undefined}>{f.type!=="checkbox"&&f.label}{f.type==="textarea"||f.type==="lines"?<textarea name={f.key} rows={4} defaultValue={value(f)} required={f.required}/>:f.type==="select"?<select name={f.key} defaultValue={value(f)} required={f.required}><option value="">Select {f.label.toLowerCase()}</option>{f.options?.map(o=><option value={o} key={o}>{o.replaceAll("_"," ")}</option>)}{f.source&&sources[f.source]?.map(r=><option value={String(r.id)} key={String(r.id)}>{String(r.name||r.room_name||`${r.building_name} · ${r.floor_label}`)}</option>)}</select>:<input name={f.key} type={f.type||"text"} defaultValue={f.type==="checkbox"?undefined:value(f)} defaultChecked={f.type==="checkbox"?Boolean(current?.[f.key]):undefined} required={f.required} step={f.type==="number"?"any":undefined} min={f.key.startsWith("coord_")?0:undefined} max={f.key.startsWith("coord_")?100:undefined}/ >}{f.type==="checkbox"&&f.label}</label>)}</div><button className="button">{busy?"Saving…":"Save changes"}</button></fieldset></form></section>;
}
