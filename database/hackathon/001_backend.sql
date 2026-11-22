-- Apply ONCE to the EXISTING SASE Supabase database. Deploy club code before 002.
-- Adds a separate hackathon schema; preserves all existing club data and identities.
begin;
do $$
begin
  if to_regclass('public.profiles') is null or to_regprocedure('public.handle_new_user()') is null then
    raise exception 'Apply this migration to the existing SASE database with profiles and handle_new_user installed.';
  end if;
end;
$$;
create schema hackathon;
revoke all on schema hackathon from public;
grant usage on schema hackathon to anon, authenticated, service_role;
create schema if not exists hackathon_private;
revoke all on schema hackathon_private from public;
grant usage on schema hackathon_private to anon, authenticated;

-- Public readiness flag, changed only by the release migration. This prevents
-- portal registrations before the club login code and signup cutover are ready.
create table hackathon.portal_configuration (
  id boolean primary key default true check (id),
  account_isolation_ready boolean not null default false
);
insert into hackathon.portal_configuration default values;
alter table hackathon.portal_configuration enable row level security;
revoke all on hackathon.portal_configuration from public,anon,authenticated;
grant select on hackathon.portal_configuration to anon,authenticated;
grant all on hackathon.portal_configuration to service_role;
create policy readiness_read on hackathon.portal_configuration for select to anon,authenticated using (true);

create table hackathon.hackathons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  timezone text not null default 'America/New_York',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hacking_starts_at timestamptz not null,
  hacking_ends_at timestamptz not null,
  applications_open_at timestamptz not null,
  applications_close_at timestamptz not null,
  rsvp_deadline timestamptz not null,
  venue_name text not null,
  venue_address text not null,
  parking_info text not null default '',
  guide_url text,
  discord_url text,
  devpost_url text,
  contact_email text not null,
  social_links jsonb not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (hacking_starts_at >= starts_at and hacking_ends_at > hacking_starts_at and hacking_ends_at <= ends_at),
  check (applications_close_at > applications_open_at)
);

create table hackathon.hackathon_staff (
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('admin','mentor','volunteer')),
  primary key (hackathon_id,user_id)
);

create function hackathon_private.is_admin(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from hackathon.hackathon_staff where hackathon_id=h and user_id=auth.uid() and role='admin');
$$;
create function hackathon_private.can_scan(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from hackathon.hackathon_staff where hackathon_id=h and user_id=auth.uid() and role in ('admin','volunteer'));
$$;
create function hackathon_private.is_published(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from hackathon.hackathons where id=h and is_published);
$$;

-- Import organizer-approved school and ISO country data before opening applications.
create table hackathon.schools (
  id text primary key,
  name text not null,
  source_version text not null,
  is_active boolean not null default true
);
create table hackathon.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null
);
create table hackathon.application_terms (
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  version text not null,
  code_of_conduct_text text not null,
  data_sharing_text text not null,
  marketing_text text not null,
  is_current boolean not null default false,
  primary key (hackathon_id,version)
);
create unique index one_current_terms on hackathon.application_terms(hackathon_id) where is_current;

create table hackathon.applications (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  first_name text not null check (length(trim(first_name)) between 1 and 100),
  last_name text not null check (length(trim(last_name)) between 1 and 100),
  email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  age integer not null check (age between 0 and 120),
  phone text not null check (length(trim(phone)) between 5 and 40),
  school_id text not null references hackathon.schools,
  level_of_study text not null check (length(trim(level_of_study)) between 1 and 100),
  country_code text not null references hackathon.countries,
  shirt_size text check (shirt_size in ('XS','S','M','L','XL','2XL','3XL','4XL','other')),
  dietary_restrictions text not null default '' check (length(dietary_restrictions)<=2000),
  resume_path text,
  status text not null default 'applied' check (status in ('applied','accepted','waitlisted','rejected','confirmed','withdrawn')),
  qr_token uuid not null unique default gen_random_uuid(),
  terms_version text not null,
  code_of_conduct_at timestamptz not null,
  data_sharing_at timestamptz not null,
  marketing_opt_in boolean not null default false,
  marketing_recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hackathon_id,user_id),
  unique (hackathon_id,id),
  foreign key (hackathon_id,terms_version) references hackathon.application_terms(hackathon_id,version)
);
create function hackathon_private.is_confirmed(h uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from hackathon.applications where hackathon_id=h and user_id=auth.uid() and status='confirmed');
$$;

create table hackathon.application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references hackathon.applications on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users on delete set null,
  changed_at timestamptz not null default now()
);
create function hackathon_private.audit_application() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP='INSERT' then
    insert into hackathon.application_status_history(application_id,new_status,changed_by) values(new.id,new.status,auth.uid());
  elsif old.status is distinct from new.status then
    insert into hackathon.application_status_history(application_id,previous_status,new_status,changed_by) values(new.id,old.status,new.status,auth.uid());
  end if;
  return new;
end;
$$;
create trigger application_audit after insert or update on hackathon.applications for each row execute function hackathon_private.audit_application();

create table hackathon.sponsors (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  name text not null,
  tier text not null,
  logo_url text,
  website_url text,
  is_partner boolean not null default false,
  display_order integer not null default 0,
  is_published boolean not null default false,
  unique (hackathon_id,id)
);
create table hackathon.tracks (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  name text not null,
  description text not null default '',
  sponsor_id uuid,
  prizes jsonb not null default '[]',
  resources_url text,
  is_published boolean not null default false,
  unique (hackathon_id,id),
  foreign key (hackathon_id,sponsor_id) references hackathon.sponsors(hackathon_id,id)
);
create table hackathon.faqs (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_published boolean not null default false
);
create table hackathon.map_floors (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  building_name text not null,
  floor_label text not null,
  image_url text not null,
  is_published boolean not null default false,
  unique (hackathon_id,id)
);
create table hackathon.locations (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  floor_id uuid not null,
  room_name text not null,
  zone_type text not null check (zone_type in ('hacking','workshop','food','sleeping','restroom','help_desk','other')),
  coord_x numeric not null check (coord_x between 0 and 100),
  coord_y numeric not null check (coord_y between 0 and 100),
  is_published boolean not null default false,
  unique (hackathon_id,id),
  foreign key (hackathon_id,floor_id) references hackathon.map_floors(hackathon_id,id)
);
create table hackathon.schedule_events (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  title text not null,
  description text not null default '',
  category text not null check (category in ('ceremony','workshop','food','mini_event','deadline')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_id uuid,
  host_name text,
  requires_checkin boolean not null default false,
  is_published boolean not null default false,
  unique (hackathon_id,id),
  foreign key (hackathon_id,location_id) references hackathon.locations(hackathon_id,id),
  check (ends_at>=starts_at)
);
create table hackathon.announcements (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  title text not null,
  body text not null,
  priority text not null default 'info' check (priority in ('info','urgent')),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
-- Keep credentials separate from publicly readable event information.
create table hackathon.hacker_resources (
  hackathon_id uuid primary key references hackathon.hackathons on delete cascade,
  wifi_ssid text,
  wifi_password text,
  wifi_instructions text not null default '',
  unlock_at timestamptz not null
);
create table hackathon.perks (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  sponsor_id uuid,
  title text not null,
  instructions text not null,
  redeem_code text,
  redeem_url text,
  unlock_at timestamptz not null,
  is_published boolean not null default false,
  foreign key (hackathon_id,sponsor_id) references hackathon.sponsors(hackathon_id,id)
);

create table hackathon.teams (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references hackathon.hackathons on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  track_id uuid,
  created_by uuid not null references auth.users,
  created_at timestamptz not null default now(),
  unique (hackathon_id,id),
  foreign key (hackathon_id,track_id) references hackathon.tracks(hackathon_id,id)
);
create table hackathon.team_members (
  hackathon_id uuid not null,
  team_id uuid not null,
  user_id uuid not null references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id,user_id),
  unique (hackathon_id,user_id),
  foreign key (hackathon_id,team_id) references hackathon.teams(hackathon_id,id) on delete cascade,
  foreign key (hackathon_id,user_id) references hackathon.applications(hackathon_id,user_id) on delete cascade
);
create function hackathon_private.on_team(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from hackathon.team_members where team_id=t and user_id=auth.uid());
$$;
create function hackathon_private.limit_team() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Serialize membership against simultaneous RSVP withdrawal as well.
  perform 1 from hackathon.applications where hackathon_id=new.hackathon_id
    and user_id=new.user_id and status='confirmed' for update;
  if not found then
    raise exception 'Confirm your RSVP before joining a team';
  end if;
  -- Lock the parent to serialize competing joins to the last available slot.
  perform 1 from hackathon.teams where id=new.team_id for update;
  if (select count(*) from hackathon.team_members where team_id=new.team_id)>=4 then
    raise exception 'Team is full';
  end if;
  return new;
end;
$$;
create trigger enforce_team_limit before insert on hackathon.team_members for each row execute function hackathon_private.limit_team();

create table hackathon.check_ins (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null,
  application_id uuid not null,
  event_id uuid,
  scanned_by uuid references auth.users on delete set null,
  scanned_at timestamptz not null default now(),
  foreign key (hackathon_id,application_id) references hackathon.applications(hackathon_id,id) on delete cascade,
  foreign key (hackathon_id,event_id) references hackathon.schedule_events(hackathon_id,id)
);
create unique index one_admission on hackathon.check_ins(application_id) where event_id is null;
create unique index one_activity_checkin on hackathon.check_ins(application_id,event_id) where event_id is not null;
create index applications_status on hackathon.applications(hackathon_id,status);
create index schedule_order on hackathon.schedule_events(hackathon_id,starts_at);
create index team_member_user on hackathon.team_members(user_id);

-- RPC-only writes for sensitive state. No browser may directly set admission,
-- staff roles, QR credentials, timestamps, consent records or team membership.
create function hackathon.submit_application(p_hackathon_id uuid, p_data jsonb, p_terms_version text,
  p_code_of_conduct boolean, p_data_sharing boolean, p_marketing boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a uuid; verified_email text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists(select 1 from hackathon.portal_configuration where account_isolation_ready) then
    raise exception 'Applications are not open yet';
  end if;
  select email into verified_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if verified_email is null then raise exception 'Verify your email first'; end if;
  if not exists(select 1 from hackathon.hackathons where id=p_hackathon_id and is_published
    and now() between applications_open_at and applications_close_at) then raise exception 'Applications are closed'; end if;
  if p_code_of_conduct is distinct from true or p_data_sharing is distinct from true or p_marketing is null then
    raise exception 'Record all consent choices';
  end if;
  if not exists(select 1 from hackathon.application_terms where hackathon_id=p_hackathon_id and version=p_terms_version and is_current) then
    raise exception 'Reload the current application terms';
  end if;
  if not exists(select 1 from hackathon.schools where id=p_data->>'school_id' and is_active) then raise exception 'Select a listed school'; end if;
  insert into hackathon.applications(hackathon_id,user_id,first_name,last_name,email,age,phone,school_id,level_of_study,
    country_code,shirt_size,dietary_restrictions,terms_version,code_of_conduct_at,data_sharing_at,marketing_opt_in,marketing_recorded_at)
  values(p_hackathon_id,auth.uid(),trim(p_data->>'first_name'),trim(p_data->>'last_name'),verified_email,
    (p_data->>'age')::integer,trim(p_data->>'phone'),p_data->>'school_id',p_data->>'level_of_study',
    p_data->>'country_code',p_data->>'shirt_size',coalesce(p_data->>'dietary_restrictions',''),p_terms_version,now(),now(),p_marketing,now())
  returning id into a;
  return a;
end;
$$;

create function hackathon.update_hacker_profile(p_hackathon_id uuid,p_data jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare path text := p_data->>'resume_path';
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if path is not null and (split_part(path,'/',1)<>p_hackathon_id::text or split_part(path,'/',2)<>auth.uid()::text
    or not exists(select 1 from storage.objects where bucket_id='hacker-resumes' and name=path)) then
    raise exception 'Upload your resume to your own folder first';
  end if;
  update hackathon.applications set
    first_name=case when p_data ? 'first_name' then trim(p_data->>'first_name') else first_name end,
    last_name=case when p_data ? 'last_name' then trim(p_data->>'last_name') else last_name end,
    phone=case when p_data ? 'phone' then trim(p_data->>'phone') else phone end,
    shirt_size=case when p_data ? 'shirt_size' then p_data->>'shirt_size' else shirt_size end,
    dietary_restrictions=case when p_data ? 'dietary_restrictions' then p_data->>'dietary_restrictions' else dietary_restrictions end,
    resume_path=case when p_data ? 'resume_path' then path else resume_path end,
    updated_at=now()
  where hackathon_id=p_hackathon_id and user_id=auth.uid();
  if not found then raise exception 'Application not found'; end if;
end;
$$;

create function hackathon.set_application_status(p_application_id uuid,p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare a hackathon.applications; deadline timestamptz;
begin
  select * into a from hackathon.applications where id=p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if hackathon_private.is_admin(a.hackathon_id) then
    if p_status not in ('accepted','waitlisted','rejected') then raise exception 'Invalid organizer decision'; end if;
    if a.status not in ('applied','accepted','waitlisted','rejected') then raise exception 'Cannot overwrite a participant RSVP'; end if;
  elsif a.user_id=auth.uid() then
    select rsvp_deadline into deadline from hackathon.hackathons where id=a.hackathon_id;
    if not ((p_status='confirmed' and a.status='accepted' and now()<=deadline)
      or (p_status='withdrawn' and a.status in ('applied','accepted','waitlisted','confirmed'))) then
      raise exception 'Invalid RSVP transition or deadline passed';
    end if;
  else raise exception 'Not authorized';
  end if;
  if p_status='withdrawn' then
    delete from hackathon.team_members where hackathon_id=a.hackathon_id and user_id=a.user_id;
    delete from hackathon.teams t where t.hackathon_id=a.hackathon_id and not exists(select 1 from hackathon.team_members m where m.team_id=t.id);
  end if;
  update hackathon.applications set status=p_status,updated_at=now() where id=a.id;
end;
$$;

create function hackathon.create_team(p_hackathon_id uuid,p_name text,p_track_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t uuid;
begin
  if not hackathon_private.is_confirmed(p_hackathon_id) then raise exception 'Confirm your RSVP first'; end if;
  insert into hackathon.teams(hackathon_id,name,track_id,created_by) values(p_hackathon_id,trim(p_name),p_track_id,auth.uid()) returning id into t;
  insert into hackathon.team_members(hackathon_id,team_id,user_id) values(p_hackathon_id,t,auth.uid());
  return t;
end;
$$;
create function hackathon.join_team(p_hackathon_id uuid,p_invite_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t uuid;
begin
  if not hackathon_private.is_confirmed(p_hackathon_id) then raise exception 'Confirm your RSVP first'; end if;
  select id into t from hackathon.teams where hackathon_id=p_hackathon_id and invite_code=upper(trim(p_invite_code)) for update;
  if t is null then raise exception 'Invalid invite code'; end if;
  insert into hackathon.team_members(hackathon_id,team_id,user_id) values(p_hackathon_id,t,auth.uid());
  return t;
end;
$$;
create function hackathon.leave_team(p_hackathon_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare t uuid;
begin
  select team_id into t from hackathon.team_members where hackathon_id=p_hackathon_id and user_id=auth.uid();
  perform 1 from hackathon.teams where id=t for update;
  delete from hackathon.team_members where team_id=t and user_id=auth.uid();
  delete from hackathon.teams where id=t and not exists(select 1 from hackathon.team_members where team_id=t);
end;
$$;
-- Deliberately return only display names to teammates, never application PII or QR tokens.
create function hackathon.get_teammates(p_hackathon_id uuid)
returns table(user_id uuid,first_name text,last_name text,joined_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select m.user_id,a.first_name,a.last_name,m.joined_at from hackathon.team_members m
  join hackathon.applications a on a.hackathon_id=m.hackathon_id and a.user_id=m.user_id
  where m.hackathon_id=p_hackathon_id and hackathon_private.on_team(m.team_id);
$$;
create function hackathon.scan_hacker(p_hackathon_id uuid,p_qr_token uuid,p_event_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a uuid; c uuid;
begin
  if not hackathon_private.can_scan(p_hackathon_id) then raise exception 'Scanner access required'; end if;
  select id into a from hackathon.applications where hackathon_id=p_hackathon_id and qr_token=p_qr_token and status='confirmed' for update;
  if a is null then raise exception 'Invalid QR code or unconfirmed RSVP'; end if;
  if p_event_id is not null and not exists(select 1 from hackathon.schedule_events where id=p_event_id and hackathon_id=p_hackathon_id and requires_checkin and is_published) then
    raise exception 'Activity does not accept check-ins';
  end if;
  insert into hackathon.check_ins(hackathon_id,application_id,event_id,scanned_by) values(p_hackathon_id,a,p_event_id,auth.uid())
  on conflict do nothing returning id into c;
  if c is null then select id into c from hackathon.check_ins where application_id=a and event_id is not distinct from p_event_id; end if;
  return c;
end;
$$;

-- Public catalog, staff-only editing, and default-deny for every other operation.
do $$
declare t text;
begin
  foreach t in array array['hackathons','hackathon_staff','schools','countries','application_terms','applications',
    'application_status_history','sponsors','tracks','faqs','map_floors','locations','schedule_events','announcements',
    'hacker_resources','perks','teams','team_members','check_ins'] loop
    execute format('alter table hackathon.%I enable row level security',t);
    execute format('revoke all on hackathon.%I from anon,authenticated',t);
    execute format('grant select on hackathon.%I to authenticated',t);
    execute format('grant all on hackathon.%I to service_role',t);
  end loop;
  foreach t in array array['sponsors','tracks','faqs','map_floors','locations','schedule_events','announcements'] loop
    execute format('grant select on hackathon.%I to anon',t);
    execute format('grant insert,update,delete on hackathon.%I to authenticated',t);
    execute format('create policy published_read on hackathon.%I for select to anon,authenticated using ((is_published and hackathon_private.is_published(hackathon_id)) or hackathon_private.is_admin(hackathon_id))',t);
    execute format('create policy admin_write on hackathon.%I for all to authenticated using (hackathon_private.is_admin(hackathon_id)) with check (hackathon_private.is_admin(hackathon_id))',t);
  end loop;
end;
$$;
grant select on hackathon.hackathons,hackathon.schools,hackathon.countries,hackathon.application_terms to anon;
grant update on hackathon.hackathons to authenticated;
create policy event_read on hackathon.hackathons for select to anon,authenticated using (is_published or hackathon_private.is_admin(id));
create policy event_edit on hackathon.hackathons for update to authenticated using (hackathon_private.is_admin(id)) with check (hackathon_private.is_admin(id));
create policy school_read on hackathon.schools for select to anon,authenticated using (is_active);
create policy country_read on hackathon.countries for select to anon,authenticated using (true);
create policy terms_read on hackathon.application_terms for select to anon,authenticated using (hackathon_private.is_published(hackathon_id));
create policy staff_self on hackathon.hackathon_staff for select to authenticated using (user_id=auth.uid() or hackathon_private.is_admin(hackathon_id));
create policy application_private on hackathon.applications for select to authenticated using (user_id=auth.uid() or hackathon_private.is_admin(hackathon_id));
create policy history_private on hackathon.application_status_history for select to authenticated using (
  exists(select 1 from hackathon.applications a where a.id=application_id and (a.user_id=auth.uid() or hackathon_private.is_admin(a.hackathon_id))));
create policy team_private on hackathon.teams for select to authenticated using (hackathon_private.on_team(id) or hackathon_private.is_admin(hackathon_id));
create policy members_private on hackathon.team_members for select to authenticated using (hackathon_private.on_team(team_id) or hackathon_private.is_admin(hackathon_id));
create policy checkin_private on hackathon.check_ins for select to authenticated using (
  hackathon_private.can_scan(hackathon_id) or exists(select 1 from hackathon.applications a where a.id=application_id and a.user_id=auth.uid()));
grant insert,update,delete on hackathon.hacker_resources,hackathon.perks to authenticated;
create policy resources_read on hackathon.hacker_resources for select to authenticated using (
  hackathon_private.is_admin(hackathon_id) or (hackathon_private.is_confirmed(hackathon_id) and now()>=unlock_at));
create policy resources_admin on hackathon.hacker_resources for all to authenticated using (hackathon_private.is_admin(hackathon_id)) with check (hackathon_private.is_admin(hackathon_id));
create policy perks_read on hackathon.perks for select to authenticated using (
  hackathon_private.is_admin(hackathon_id) or (is_published and hackathon_private.is_confirmed(hackathon_id) and now()>=unlock_at));
create policy perks_admin on hackathon.perks for all to authenticated using (hackathon_private.is_admin(hackathon_id)) with check (hackathon_private.is_admin(hackathon_id));

-- Functions are executable by PUBLIC unless explicitly revoked.
revoke all on all functions in schema hackathon_private from public;
grant execute on all functions in schema hackathon_private to anon,authenticated;
do $$
declare f record;
begin
  for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='hackathon' and p.proname in ('submit_application','update_hacker_profile','set_application_status',
      'create_team','join_team','leave_team','get_teammates','scan_hacker') loop
    execute format('revoke all on function %s from public,anon',f.signature);
    execute format('grant execute on function %s to authenticated',f.signature);
  end loop;
end;
$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('hacker-resumes','hacker-resumes',false,5242880,array['application/pdf']);
create policy resume_owner_read on storage.objects for select to authenticated using (
  bucket_id='hacker-resumes' and (storage.foldername(name))[2]=auth.uid()::text);
create policy resume_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id='hacker-resumes' and (storage.foldername(name))[2]=auth.uid()::text
  and exists(select 1 from hackathon.applications a where a.user_id=auth.uid() and a.hackathon_id::text=(storage.foldername(name))[1]));
create policy resume_owner_delete on storage.objects for delete to authenticated using (
  bucket_id='hacker-resumes' and (storage.foldername(name))[2]=auth.uid()::text);
create policy resume_admin_read on storage.objects for select to authenticated using (
  bucket_id='hacker-resumes' and exists(select 1 from hackathon.hackathon_staff s
    where s.user_id=auth.uid() and s.role='admin' and s.hackathon_id::text=(storage.foldername(name))[1]));

-- Existing projects can have permissive policies such as USING(true). PostgreSQL
-- ORs permissive policies, so private buckets alone do not guarantee privacy.
-- Restrict only our bucket, leaving all existing public assets accessible.
create function hackathon_private.can_read_resume(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    (storage.foldername(path))[2]=auth.uid()::text or exists(
      select 1 from hackathon.hackathon_staff s where s.user_id=auth.uid()
      and s.role='admin' and s.hackathon_id::text=(storage.foldername(path))[1]
    )
  );
$$;
revoke all on function hackathon_private.can_read_resume(text) from public;
grant execute on function hackathon_private.can_read_resume(text) to anon,authenticated;
create policy hackathon_resume_read_guard on storage.objects as restrictive for select to public
using (bucket_id <> 'hacker-resumes' or hackathon_private.can_read_resume(name));

create function public.ensure_club_profile() returns void
language plpgsql security definer set search_path = '' as $$
declare
  u auth.users;
  meta jsonb;
  display_name text;
  first_name text;
  last_name text;
  space_pos integer;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  -- Never overwrite an existing member's information or privileges.
  if exists(select 1 from public.profiles where id=auth.uid()) then return; end if;
  select * into u from auth.users where id=auth.uid();
  if u.email is null then raise exception 'An email address is required to join the club'; end if;
  meta := coalesce(u.raw_user_meta_data,'{}'::jsonb);
  if nullif(trim(meta->>'given_name'),'') is not null then
    first_name := trim(meta->>'given_name');
    last_name := coalesce(trim(meta->>'family_name'),'');
  elsif nullif(trim(meta->>'first_name'),'') is not null then
    first_name := trim(meta->>'first_name');
    last_name := coalesce(trim(meta->>'last_name'),'');
  else
    display_name := coalesce(nullif(trim(meta->>'full_name'),''),nullif(trim(meta->>'name'),''),
      nullif(trim(meta->>'username'),''),nullif(trim(meta->>'user_name'),''),'New Member');
    space_pos := strpos(display_name,' ');
    first_name := case when space_pos>0 then left(display_name,space_pos-1) else display_name end;
    last_name := case when space_pos>0 then substr(display_name,space_pos+1) else '' end;
  end if;
  insert into public.profiles(id,first_name,last_name,email,major,year,school,name_confirmed,role,paid_member,total_points)
  values(u.id,first_name,last_name,u.email,coalesce(meta->>'major',''),coalesce(meta->>'year',''),
    coalesce(meta->>'school',''),false,'member',false,0)
  on conflict (id) do nothing;
end;
$$;
revoke all on function public.ensure_club_profile() from public,anon;
grant execute on function public.ensure_club_profile() to authenticated;

commit;
