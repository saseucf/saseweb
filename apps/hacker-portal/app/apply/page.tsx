"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gate, Notice, usePortal } from "../../components/shared";
import { applicationWindow, dateTime } from "../../../../lib/hackathon/portal";
import { hackathonApi, type ApplicationInput } from "../../../../lib/hackathon/api";
type Terms = { version: string; code_of_conduct_text: string; data_sharing_text: string; marketing_text: string };
export default function ApplyPage() { return <Gate><ApplicationForm /></Gate>; }
function ApplicationForm() {
  const { client, landing, user } = usePortal(), router = useRouter();
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]), [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [terms, setTerms] = useState<Terms | null>(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(""), [school, setSchool] = useState("");
  const event = landing!.event;
  useEffect(() => {
    if (!client) return; let active = true;
    const db = client.schema("hackathon");
    void Promise.all([
      db.from("countries").select("code,name").order("name"),
      db.from("application_terms").select("*").eq("hackathon_id", event.id).eq("is_current", true).single(),
      db.from("applications").select("id").eq("hackathon_id", event.id).eq("user_id", user!.id).maybeSingle(),
    ]).then(([c, t, a]) => {
      if (!active) return;
      if (a.error || c.error || t.error) { setError("The application isn’t available yet. Please try again later."); }
      else if (a.data) router.replace("/dashboard");
      else { setCountries(c.data); setTerms(t.data); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [client, event.id, router, user]);
  useEffect(() => {
    if (!client) return; let active = true;
    const timeout = setTimeout(() => {
      // Filter wildcards to make school searching a literal prefix query.
      const query = search.trim().replace(/[%_\\]/g, "").slice(0,100);
      let request = client.schema("hackathon").from("schools").select("id,name").eq("is_active", true).order("name").limit(40);
      if (query) request = request.ilike("name", `%${query}%`);
      void request.then(({ data }) => { if (active) setSchools(data ?? []); });
    }, 250);
    return () => { active = false; clearTimeout(timeout); };
  }, [client, search]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!client || !terms) return; setError(""); setBusy(true);
    const form = new FormData(e.currentTarget);
    const input: ApplicationInput = { first_name: String(form.get("first_name")), last_name: String(form.get("last_name")), age: Number(form.get("age")), phone: String(form.get("phone")), school_id: school, level_of_study: String(form.get("level_of_study")), country_code: String(form.get("country_code")), shirt_size: String(form.get("shirt_size")) as ApplicationInput["shirt_size"], dietary_restrictions: String(form.get("dietary_restrictions")) };
    try { await hackathonApi(client).submitApplication(event.id, input, terms.version, { codeOfConduct: form.has("conduct"), dataSharing: form.has("sharing"), marketing: form.has("marketing") }); router.replace("/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : "We couldn’t submit your application. Please try again."); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="page narrow"><Notice>Loading the application…</Notice></div>;
  if (applicationWindow(event) !== "open") return <div className="page narrow"><h1>Applications {applicationWindow(event) === "closed" ? "have closed." : "open soon."}</h1><p>Application window: {dateTime(event.applications_open_at,event.timezone)} – {dateTime(event.applications_close_at,event.timezone)}</p><Link href="/dashboard">Return to your hacker hub</Link></div>;
  return <div className="page application-page"><header><p className="eyebrow">Your next big what-if</p><h1>Let’s get to<br /><em>know you.</em></h1><p>Apply to {event.name}. You can update your shirt size, dietary needs, and resume afterward.</p><p>Account email: <strong>{user?.email}</strong></p></header><form onSubmit={submit}>{error && <Notice error>{error}</Notice>}<fieldset disabled={busy || !terms}><legend>About you</legend><div className="form-grid"><label>First name<input name="first_name" maxLength={100} autoComplete="given-name" required /></label><label>Last name<input name="last_name" maxLength={100} autoComplete="family-name" required /></label><label>Age<input name="age" type="number" min={0} max={120} required /></label><label>Phone number<input name="phone" type="tel" maxLength={40} minLength={5} autoComplete="tel" required /></label><label>Country<select name="country_code" defaultValue="US" required><option value="" disabled>Select country</option>{countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label><label>Level of study<select name="level_of_study" required defaultValue=""><option value="" disabled>Select level of study</option>{["High school", "Undergraduate", "Graduate", "Other"].map(l => <option key={l}>{l}</option>)}</select></label></div><label>Find your school<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by official school name" type="search" /></label><label>School<select value={school} onChange={e => setSchool(e.target.value)} required><option value="" disabled>Select a school from the list</option>{schools.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label><p className="muted">Don’t see your school? Try another part of its official name or contact the organizers.</p></fieldset><fieldset disabled={busy || !terms}><legend>Make yourself at home</legend><label>Shirt size<select name="shirt_size" defaultValue="M">{["XS","S","M","L","XL","2XL","3XL","4XL","other"].map(s => <option key={s}>{s}</option>)}</select></label><label>Dietary restrictions<textarea name="dietary_restrictions" maxLength={2000} rows={3} placeholder="Tell us about any dietary needs or allergies." /></label></fieldset><fieldset disabled={busy || !terms}><legend>Before you submit</legend>{terms && <><label className="check"><input type="checkbox" name="conduct" required /><span>{terms.code_of_conduct_text}</span></label><label className="check"><input type="checkbox" name="sharing" required /><span>{terms.data_sharing_text}</span></label><label className="check"><input type="checkbox" name="marketing" /><span>{terms.marketing_text} <small>(Optional)</small></span></label></>}<button className="button" disabled={busy || !terms}>{busy ? "Submitting…" : "Submit application"}</button></fieldset></form></div>;
}
