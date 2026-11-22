import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

// An isolated dependency directory avoids changing the app's installed packages.
const { PGlite } = await import(process.env.HACKATHON_PGLITE_MODULE
  ? pathToFileURL(process.env.HACKATHON_PGLITE_MODULE).href
  : '@electric-sql/pglite');

const db = new PGlite();
const h = '10000000-0000-0000-0000-000000000001';
const users = Array.from({ length: 7 }, (_, i) => `20000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`);
const admin = users[6];
let checks = 0;
async function check(name, fn) {
  await fn(); checks++; console.log(`PASS ${name}`);
}
async function as(user, sql, params = []) {
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user ?? '']);
  try { return await db.query(sql, params); }
  finally { await db.exec('reset role'); }
}
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as
      $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
    grant usage on schema storage to authenticated;
    grant select,insert,delete on storage.objects to authenticated;
  `);
  const migration = await readFile(new URL('../database/hackathon/001_backend.sql', import.meta.url), 'utf8');
  await check('migration refuses a SASE project', async () => {
    await db.exec('create table public.profiles(id uuid)');
    await assert.rejects(db.exec(migration), /standalone portal migration/);
    await db.exec('rollback; drop table public.profiles');
  });
  await check('migration executes in PostgreSQL', async () => { await db.exec(migration); });
  for (const [i, user] of users.entries()) {
    await db.query('insert into auth.users values($1,$2,now())', [user, `hacker${i}@example.com`]);
  }
  await db.query(`insert into public.hackathons(id,slug,name,starts_at,ends_at,hacking_starts_at,hacking_ends_at,
    applications_open_at,applications_close_at,rsvp_deadline,venue_name,venue_address,contact_email,is_published)
    values($1,'test-event','Test',now()+interval '2 days',now()+interval '4 days',now()+interval '2 days',now()+interval '3 days',
    now()-interval '1 day',now()+interval '1 day',now()+interval '2 days','Venue','Address','test@example.com',true)`, [h]);
  await db.query("insert into public.hackathon_staff values($1,$2,'admin')", [h, admin]);
  await db.exec("insert into public.schools values('school','Test School','test',true); insert into public.countries values('US','United States');");
  await db.query("insert into public.application_terms values($1,'v1','Conduct','Sharing','Optional marketing',true)", [h]);
  const input = { first_name: 'Test', last_name: 'Hacker', age: 20, phone: '1234567890', school_id: 'school', level_of_study: 'Undergraduate', country_code: 'US' };
  const apply = (u, conduct = true, sharing = true) => as(u,
    'select public.submit_application($1,$2::jsonb,$3,$4,$5,false) id', [h, JSON.stringify(input), 'v1', conduct, sharing]);
  await check('anonymous cannot apply', async () => { await assert.rejects(apply(null)); });
  await check('mandatory consent enforced', async () => { await assert.rejects(apply(users[0], false)); });
  await check('unverified email and closed application windows rejected', async () => {
    await db.query('update auth.users set email_confirmed_at=null where id=$1', [users[0]]);
    await assert.rejects(apply(users[0]));
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [users[0]]);
    await db.query("update public.hackathons set applications_close_at=now()-interval '1 hour' where id=$1", [h]);
    await assert.rejects(apply(users[0]));
    await db.query("update public.hackathons set applications_close_at=now()+interval '1 day' where id=$1", [h]);
  });
  const ids = [];
  await check('verified accounts apply with optional marketing false', async () => {
    for (const u of users.slice(0, 6)) ids.push((await apply(u)).rows[0].id);
  });
  await check('one application per account per edition', async () => { await assert.rejects(apply(users[0])); });
  await check('public cannot read applications; another user sees only their own', async () => {
    await assert.rejects(as(null, 'select * from public.applications'));
    assert.equal((await as(users[1], 'select * from public.applications')).rows.length, 1);
    assert.equal((await as(users[1], 'select * from public.applications where id=$1', [ids[0]])).rows.length, 0);
  });
  await check('cannot self-accept or bypass RPC using table writes', async () => {
    await assert.rejects(as(users[0], "select public.set_application_status($1,'accepted')", [ids[0]]));
    await assert.rejects(as(users[0], "update public.applications set status='confirmed'"));
    await assert.rejects(as(users[0], "insert into public.hackathon_staff values($1,$2,'admin')", [h, users[0]]));
  });
  await check('organizer accepts, owner confirms, audit is recorded', async () => {
    for (let i = 0; i < ids.length; i++) {
      await as(admin, "select public.set_application_status($1,'accepted')", [ids[i]]);
      await as(users[i], "select public.set_application_status($1,'confirmed')", [ids[i]]);
    }
    assert.equal((await as(users[0], 'select * from public.application_status_history')).rows.length, 3);
  });
  await check('profile updates cannot alter admission, consent, or QR credentials', async () => {
    const before = (await as(users[0], 'select * from public.applications')).rows[0];
    await as(users[0], 'select public.update_hacker_profile($1,$2::jsonb)', [h, JSON.stringify({ shirt_size: 'M', status: 'accepted', qr_token: users[0], marketing_opt_in: true })]);
    const after = (await as(users[0], 'select * from public.applications')).rows[0];
    assert.equal(after.shirt_size, 'M');
    assert.equal(after.qr_token, before.qr_token);
    assert.equal(after.status, 'confirmed');
    assert.equal(after.marketing_opt_in, false);
  });
  const team = (await as(users[0], 'select public.create_team($1,$2) id', [h, 'Team'])).rows[0].id;
  const code = (await as(users[0], 'select invite_code from public.teams where id=$1', [team])).rows[0].invite_code;
  await check('team invitations private to members', async () => {
    assert.equal((await as(users[1], 'select * from public.teams')).rows.length, 0);
  });
  await check('four-member team limit and one-team constraint', async () => {
    for (const u of users.slice(1, 4)) await as(u, 'select public.join_team($1,$2)', [h, code]);
    await assert.rejects(as(users[4], 'select public.join_team($1,$2)', [h, code]));
    await assert.rejects(as(users[0], 'select public.create_team($1,$2)', [h, 'Duplicate']));
    assert.equal((await as(users[0], 'select * from public.get_teammates($1)', [h])).rows.length, 4);
    assert.equal((await as(users[4], 'select * from public.get_teammates($1)', [h])).rows.length, 0);
  });
  await check('resources and perks respect time and confirmation gates', async () => {
    await db.query("insert into public.hacker_resources values($1,'SSID','SECRET','',now()+interval '1 day')", [h]);
    await db.query("insert into public.perks(hackathon_id,title,instructions,redeem_code,unlock_at,is_published) values($1,'Credits','Redeem','SECRET',now()+interval '1 day',true)", [h]);
    assert.equal((await as(users[0], 'select * from public.hacker_resources')).rows.length, 0);
    assert.equal((await as(users[0], 'select * from public.perks')).rows.length, 0);
    await db.exec("update public.hacker_resources set unlock_at=now()-interval '1 second'; update public.perks set unlock_at=now()-interval '1 second'");
    assert.equal((await as(users[0], 'select * from public.hacker_resources')).rows.length, 1);
    assert.equal((await as(users[0], 'select * from public.perks')).rows.length, 1);
  });
  const token = (await as(users[0], 'select qr_token from public.applications')).rows[0].qr_token;
  await check('only staff scan; duplicate general admission is idempotent', async () => {
    await assert.rejects(as(users[1], 'select public.scan_hacker($1,$2)', [h, token]));
    const one = await as(admin, 'select public.scan_hacker($1,$2) id', [h, token]);
    const two = await as(admin, 'select public.scan_hacker($1,$2) id', [h, token]);
    assert.equal(one.rows[0].id, two.rows[0].id);
    assert.equal((await as(users[0], 'select * from public.check_ins')).rows.length, 1);
  });
  await check('activity check-ins are separately deduplicated and require enabled events', async () => {
    const event = (await db.query(`insert into public.schedule_events(hackathon_id,title,category,starts_at,ends_at,requires_checkin,is_published)
      values($1,'Meal','food',now(),now()+interval '1 hour',true,true) returning id`, [h])).rows[0].id;
    const one = await as(admin, 'select public.scan_hacker($1,$2,$3) id', [h, token, event]);
    const two = await as(admin, 'select public.scan_hacker($1,$2,$3) id', [h, token, event]);
    assert.equal(one.rows[0].id, two.rows[0].id);
    assert.equal((await as(users[0], 'select * from public.check_ins')).rows.length, 2);
    await db.query('update public.schedule_events set requires_checkin=false where id=$1', [event]);
    await assert.rejects(as(admin, 'select public.scan_hacker($1,$2,$3)', [h, token, event]));
  });
  await check('withdrawal removes membership and revokes resources', async () => {
    await as(users[0], "select public.set_application_status($1,'withdrawn')", [ids[0]]);
    assert.equal((await as(users[0], 'select * from public.team_members')).rows.length, 0);
    assert.equal((await as(users[0], 'select * from public.hacker_resources')).rows.length, 0);
    await assert.rejects(as(admin, 'select public.scan_hacker($1,$2)', [h, token]));
  });
  await check('volunteer can scan without reading application PII', async () => {
    await db.query("insert into public.hackathon_staff values($1,$2,'volunteer')", [h, users[5]]);
    const otherToken = (await as(users[1], 'select qr_token from public.applications')).rows[0].qr_token;
    await as(users[5], 'select public.scan_hacker($1,$2)', [h, otherToken]);
    assert.equal((await as(users[5], 'select * from public.applications where user_id<>$1', [users[5]])).rows.length, 0);
  });
  await check('private resume ownership and cross-user paths enforced', async () => {
    const path = `${h}/${users[1]}/test.pdf`;
    await as(users[1], "insert into storage.objects(bucket_id,name) values('hacker-resumes',$1)", [path]);
    await assert.rejects(as(users[2], "insert into storage.objects(bucket_id,name) values('hacker-resumes',$1)", [path]));
    assert.equal((await as(users[2], 'select * from storage.objects')).rows.length, 0);
    assert.equal((await as(admin, 'select * from storage.objects')).rows.length, 1);
    await as(users[1], 'select public.update_hacker_profile($1,$2::jsonb)', [h, JSON.stringify({ resume_path: path })]);
    await assert.rejects(as(users[2], 'select public.update_hacker_profile($1,$2::jsonb)', [h, JSON.stringify({ resume_path: path })]));
  });
  console.log(`${checks} database integration checks passed.`);
} finally { await db.close(); }
