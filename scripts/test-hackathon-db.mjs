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
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select current_setting('request.jwt.claim.role',true) $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as
      $$ select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1] $$;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,delete on storage.objects to authenticated;
    grant select on storage.objects to anon;
    create policy legacy_public_storage_read on storage.objects for select to anon,authenticated using(true);
  `);
  const migration = await readFile(new URL('../database/hackathon/001_backend.sql', import.meta.url), 'utf8');
  await check('migration requires the existing club database', async () => {
    await assert.rejects(db.exec(migration), /existing SASE database/);
    await db.exec('rollback');
  });
  // Use the real club profile schema, signup handler and privilege-protection
  // triggers. Remaining Auth/Storage objects are minimal hosted-service stubs.
  const clubSchema = (await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'))
    .split('-- 2. EVENTS TABLE')[0]
    .replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '');
  await db.exec(clubSchema);
  for (const [i, user] of [[0, users[0]], [6, admin]]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [user, `hacker${i}@example.com`]);
  }
  await db.query("update public.profiles set total_points=42,paid_member=true,school='Existing School' where id=$1", [users[0]]);
  await db.query("update public.profiles set role='admin' where id=$1", [admin]);
  await db.exec(`create table public.events(id uuid primary key,title text);
    create table public.event_attendances(id uuid primary key,user_id uuid,event_id uuid);
    create table public.teams(id uuid primary key,name text);
    create table public.sponsors(id uuid primary key,name text);
    insert into public.teams values(gen_random_uuid(),'Club Team');
    insert into public.sponsors values(gen_random_uuid(),'Club Sponsor');
    insert into public.events values(gen_random_uuid(),'Club Event');
    insert into public.event_attendances select gen_random_uuid(),'${users[0]}',id from public.events;
    create table public.form_submissions(id uuid default gen_random_uuid());
    create function public.legacy_preregistration() returns trigger language plpgsql as $$
      begin update public.profiles set school='Should not change'; return new; end; $$;
    create trigger mark_luma_hacks_participant_on_submission after insert on public.form_submissions
      for each row execute function public.legacy_preregistration();`);
  const clubBefore = (await db.query('select * from public.profiles order by id')).rows;
  const attendanceBefore = (await db.query('select * from public.event_attendances')).rows;
  await check('migration coexists with club tables and preserves members and attendance', async () => {
    await db.exec(migration);
    assert.deepEqual((await db.query('select * from public.profiles order by id')).rows, clubBefore);
    assert.deepEqual((await db.query('select * from public.event_attendances')).rows, attendanceBefore);
    assert.equal((await db.query('select name from public.teams')).rows[0].name, 'Club Team');
    assert.equal((await db.query('select name from public.sponsors')).rows[0].name, 'Club Sponsor');
  });
  await check('account cutover stays disabled until the separate release migration', async () => {
    assert.equal((await as(null, 'select account_isolation_ready from hackathon.portal_configuration')).rows[0].account_isolation_ready, false);
    await assert.rejects(as(users[0], "select hackathon.submit_application($1,'{}'::jsonb,'v1',true,true,false)", [h]), /not open yet/);
    await db.exec(await readFile(new URL('../database/hackathon/002_account_isolation.sql', import.meta.url), 'utf8'));
  });
  await check('confirmed date-only details do not fabricate an operational event or open registration', async () => {
    await db.exec(await readFile(new URL('../database/hackathon/004_confirmed_public_details.sql', import.meta.url), 'utf8'));
    const details=(await as(null,'select public_details from hackathon.portal_configuration')).rows[0].public_details;
    assert.equal(details.starts_on,'2027-03-06');
    assert.equal(details.rsvp_deadline_on,'2027-02-15');
    assert.equal((await db.query('select count(*)::int n from hackathon.hackathons')).rows[0].n,0);
  });
  await check('legacy preregistration no longer mutates club profiles', async () => {
    await db.exec('insert into public.form_submissions default values');
    assert.deepEqual((await db.query('select * from public.profiles order by id')).rows, clubBefore);
  });
  for (const [i, user] of users.entries()) {
    if (i===0 || i===6) continue;
    await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
      [user, `hacker${i}@example.com`, i===2 ? '{"given_name":"External","family_name":"OAuth"}' : '{}']);
  }
  await check('external email and OAuth signups do not create club profiles', async () => {
    assert.deepEqual((await db.query('select * from public.profiles order by id')).rows, clubBefore);
  });
  await check('explicit club registration and invites retain signup profiles', async () => {
    for (const [suffix, metadata] of [['1', {signup_profile_complete:true}],['2', {account_context:'club'}]]) {
      const id = `30000000-0000-0000-0000-00000000000${suffix}`;
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [id, `club${suffix}@example.com`, JSON.stringify(metadata)]);
      assert.equal((await db.query('select role from public.profiles where id=$1', [id])).rows[0].role, 'member');
    }
  });
  await db.query(`insert into hackathon.hackathons(id,slug,name,starts_at,ends_at,hacking_starts_at,hacking_ends_at,
    applications_open_at,applications_close_at,rsvp_deadline,venue_name,venue_address,contact_email,is_published)
    values($1,'test-event','Test',now()+interval '2 days',now()+interval '4 days',now()+interval '2 days',now()+interval '3 days',
    now()-interval '1 day',now()+interval '1 day',now()+interval '2 days','Venue','Address','test@example.com',true)`, [h]);
  await check('club admin role alone grants no hackathon staff privileges', async () => {
    assert.equal((await as(admin, 'select hackathon_private.is_admin($1) allowed', [h])).rows[0].allowed, false);
  });
  await db.query("insert into hackathon.hackathon_staff values($1,$2,'admin')", [h, admin]);
  await db.exec("insert into hackathon.schools values('school','Test School','test',true); insert into hackathon.countries values('US','United States');");
  await db.query("insert into hackathon.application_terms values($1,'v1','Conduct','Sharing','Optional marketing',true)", [h]);
  const input = { first_name: 'Test', last_name: 'Hacker', age: 20, phone: '1234567890', school_id: 'school', level_of_study: 'Undergraduate', country_code: 'US' };
  const apply = (u, conduct = true, sharing = true) => as(u,
    'select hackathon.submit_application($1,$2::jsonb,$3,$4,$5,false) id', [h, JSON.stringify(input), 'v1', conduct, sharing]);
  await check('anonymous cannot apply', async () => { await assert.rejects(apply(null)); });
  await check('mandatory consent enforced', async () => { await assert.rejects(apply(users[0], false)); });
  await check('unverified email and closed application windows rejected', async () => {
    await db.query('update auth.users set email_confirmed_at=null where id=$1', [users[0]]);
    await assert.rejects(apply(users[0]));
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [users[0]]);
    await db.query("update hackathon.hackathons set applications_close_at=now()-interval '1 hour' where id=$1", [h]);
    await assert.rejects(apply(users[0]));
    await db.query("update hackathon.hackathons set applications_close_at=now()+interval '1 day' where id=$1", [h]);
  });
  const ids = [];
  await check('verified accounts apply with optional marketing false', async () => {
    for (const u of users.slice(0, 6)) ids.push((await apply(u)).rows[0].id);
  });
  await check('one application per account per edition', async () => { await assert.rejects(apply(users[0])); });
  await check('applications link existing shared accounts directly and require a valid FK', async () => {
    assert.equal((await db.query('select user_id from hackathon.applications where id=$1', [ids[0]])).rows[0].user_id, users[0]);
    await assert.rejects(db.query("update hackathon.applications set user_id='ffffffff-ffff-ffff-ffff-ffffffffffff' where id=$1", [ids[0]]), /foreign key/);
  });
  await check('public cannot read applications; another user sees only their own', async () => {
    await assert.rejects(as(null, 'select * from hackathon.applications'));
    assert.equal((await as(users[1], 'select * from hackathon.applications')).rows.length, 1);
    assert.equal((await as(users[1], 'select * from hackathon.applications where id=$1', [ids[0]])).rows.length, 0);
  });
  await check('cannot self-accept or bypass RPC using table writes', async () => {
    await assert.rejects(as(users[0], "select hackathon.set_application_status($1,'accepted')", [ids[0]]));
    await assert.rejects(as(users[0], "update hackathon.applications set status='confirmed'"));
    await assert.rejects(as(users[0], "insert into hackathon.hackathon_staff values($1,$2,'admin')", [h, users[0]]));
  });
  await check('organizer accepts, owner confirms, audit is recorded', async () => {
    for (let i = 0; i < ids.length; i++) {
      await as(admin, "select hackathon.set_application_status($1,'accepted')", [ids[i]]);
      await as(users[i], "select hackathon.set_application_status($1,'confirmed')", [ids[i]]);
    }
    assert.equal((await as(users[0], 'select * from hackathon.application_status_history')).rows.length, 3);
  });
  await check('profile updates cannot alter admission, consent, or QR credentials', async () => {
    const before = (await as(users[0], 'select * from hackathon.applications')).rows[0];
    await as(users[0], 'select hackathon.update_hacker_profile($1,$2::jsonb)', [h, JSON.stringify({ shirt_size: 'M', status: 'accepted', qr_token: users[0], marketing_opt_in: true })]);
    const after = (await as(users[0], 'select * from hackathon.applications')).rows[0];
    assert.equal(after.shirt_size, 'M');
    assert.equal(after.qr_token, before.qr_token);
    assert.equal(after.status, 'confirmed');
    assert.equal(after.marketing_opt_in, false);
  });
  const team = (await as(users[0], 'select hackathon.create_team($1,$2) id', [h, 'Team'])).rows[0].id;
  const code = (await as(users[0], 'select invite_code from hackathon.teams where id=$1', [team])).rows[0].invite_code;
  await check('team invitations private to members', async () => {
    assert.equal((await as(users[1], 'select * from hackathon.teams')).rows.length, 0);
  });
  await check('four-member team limit and one-team constraint', async () => {
    for (const u of users.slice(1, 4)) await as(u, 'select hackathon.join_team($1,$2)', [h, code]);
    await assert.rejects(as(users[4], 'select hackathon.join_team($1,$2)', [h, code]));
    await assert.rejects(as(users[0], 'select hackathon.create_team($1,$2)', [h, 'Duplicate']));
    assert.equal((await as(users[0], 'select * from hackathon.get_teammates($1)', [h])).rows.length, 4);
    assert.equal((await as(users[4], 'select * from hackathon.get_teammates($1)', [h])).rows.length, 0);
  });
  await check('resources and perks respect time and confirmation gates', async () => {
    await db.query("insert into hackathon.hacker_resources values($1,'SSID','SECRET','',now()+interval '1 day')", [h]);
    await db.query("insert into hackathon.perks(hackathon_id,title,instructions,redeem_code,unlock_at,is_published) values($1,'Credits','Redeem','SECRET',now()+interval '1 day',true)", [h]);
    assert.equal((await as(users[0], 'select * from hackathon.hacker_resources')).rows.length, 0);
    assert.equal((await as(users[0], 'select * from hackathon.perks')).rows.length, 0);
    await db.exec("update hackathon.hacker_resources set unlock_at=now()-interval '1 second'; update hackathon.perks set unlock_at=now()-interval '1 second'");
    assert.equal((await as(users[0], 'select * from hackathon.hacker_resources')).rows.length, 1);
    assert.equal((await as(users[0], 'select * from hackathon.perks')).rows.length, 1);
  });
  const token = (await as(users[0], 'select qr_token from hackathon.applications')).rows[0].qr_token;
  await check('only staff scan; duplicate general admission is idempotent', async () => {
    await assert.rejects(as(users[1], 'select hackathon.scan_hacker($1,$2)', [h, token]));
    const one = await as(admin, 'select hackathon.scan_hacker($1,$2) id', [h, token]);
    const two = await as(admin, 'select hackathon.scan_hacker($1,$2) id', [h, token]);
    assert.equal(one.rows[0].id, two.rows[0].id);
    assert.equal((await as(users[0], 'select * from hackathon.check_ins')).rows.length, 1);
  });
  await check('activity check-ins are separately deduplicated and require enabled events', async () => {
    const event = (await db.query(`insert into hackathon.schedule_events(hackathon_id,title,category,starts_at,ends_at,requires_checkin,is_published)
      values($1,'Meal','food',now(),now()+interval '1 hour',true,true) returning id`, [h])).rows[0].id;
    const one = await as(admin, 'select hackathon.scan_hacker($1,$2,$3) id', [h, token, event]);
    const two = await as(admin, 'select hackathon.scan_hacker($1,$2,$3) id', [h, token, event]);
    assert.equal(one.rows[0].id, two.rows[0].id);
    assert.equal((await as(users[0], 'select * from hackathon.check_ins')).rows.length, 2);
    await db.query('update hackathon.schedule_events set requires_checkin=false where id=$1', [event]);
    await assert.rejects(as(admin, 'select hackathon.scan_hacker($1,$2,$3)', [h, token, event]));
  });
  await check('withdrawal removes membership and revokes resources', async () => {
    await as(users[0], "select hackathon.set_application_status($1,'withdrawn')", [ids[0]]);
    assert.equal((await as(users[0], 'select * from hackathon.team_members')).rows.length, 0);
    assert.equal((await as(users[0], 'select * from hackathon.hacker_resources')).rows.length, 0);
    await assert.rejects(as(admin, 'select hackathon.scan_hacker($1,$2)', [h, token]));
  });
  await check('volunteer can scan without reading application PII', async () => {
    await db.query("insert into hackathon.hackathon_staff values($1,$2,'volunteer')", [h, users[5]]);
    const otherToken = (await as(users[1], 'select qr_token from hackathon.applications')).rows[0].qr_token;
    await as(users[5], 'select hackathon.scan_hacker($1,$2)', [h, otherToken]);
    assert.equal((await as(users[5], 'select * from hackathon.applications where user_id<>$1', [users[5]])).rows.length, 0);
  });
  await check('private resume ownership and cross-user paths enforced', async () => {
    const path = `${h}/${users[1]}/test.pdf`;
    await as(users[1], "insert into storage.objects(bucket_id,name) values('hacker-resumes',$1)", [path]);
    await assert.rejects(as(users[2], "insert into storage.objects(bucket_id,name) values('hacker-resumes',$1)", [path]));
    assert.equal((await as(users[2], 'select * from storage.objects')).rows.length, 0);
    assert.equal((await as(null, 'select * from storage.objects')).rows.length, 0);
    assert.equal((await as(admin, 'select * from storage.objects')).rows.length, 1);
    await as(users[1], 'select hackathon.update_hacker_profile($1,$2::jsonb)', [h, JSON.stringify({ resume_path: path })]);
    await assert.rejects(as(users[2], 'select hackathon.update_hacker_profile($1,$2::jsonb)', [h, JSON.stringify({ resume_path: path })]));
  });
  await check('restrictive resume guard preserves existing public bucket access', async () => {
    await db.exec("insert into storage.objects(bucket_id,name) values('gbm1','public-photo.png')");
    const rows=(await as(null,'select * from storage.objects')).rows;
    assert.equal(rows.length,1);
    assert.equal(rows[0].bucket_id,'gbm1');
  });
  await check('hackathon activity never changes an existing SASE member profile or club attendance', async () => {
    assert.deepEqual((await db.query('select * from public.profiles where id=$1', [users[0]])).rows[0], clubBefore.find(p => p.id===users[0]));
    assert.deepEqual((await db.query('select * from public.event_attendances')).rows, attendanceBefore);
    assert.equal((await db.query('select count(*)::int n from public.profiles where id=any($1::uuid[])', [users.slice(1,6)])).rows[0].n, 0);
  });
  await check('explicit club enrollment reuses the account without granting elevated privileges', async () => {
    await db.query('update auth.users set raw_user_meta_data=$1 where id=$2', [JSON.stringify({given_name:'External',family_name:'Hacker',role:'admin',is_admin:true,paid_member:true,total_points:999}),users[4]]);
    await assert.rejects(as(null, 'select public.ensure_club_profile()'));
    await as(users[4], 'select public.ensure_club_profile()');
    const profile = (await db.query('select * from public.profiles where id=$1', [users[4]])).rows[0];
    assert.equal(profile.first_name, 'External');
    assert.equal(profile.role, 'member');
    assert.equal(profile.is_admin, false);
    assert.equal(profile.paid_member, false);
    assert.equal(profile.total_points, 0);
    await as(users[0], 'select public.ensure_club_profile()');
    assert.deepEqual((await db.query('select * from public.profiles where id=$1', [users[0]])).rows[0], clubBefore.find(p => p.id===users[0]));
  });
  console.log(`${checks} database integration checks passed.`);
} finally { await db.close(); }
