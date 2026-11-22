-- Run after 001. Adds the portal API without changing the existing schema order.
-- The fallback matches this project's verified pre-existing API exposure:
-- public, graphql_public. Keep this in sync with Supabase API settings.
begin;
do $$
declare exposed text;
begin
  select substr(setting,length('pgrst.db_schemas=')+1) into exposed
  from pg_roles r cross join unnest(r.rolconfig) setting
  where r.rolname='authenticator' and setting like 'pgrst.db_schemas=%';
  exposed := coalesce(exposed,'public,graphql_public');
  if not ('hackathon'=any(regexp_split_to_array(exposed,'\s*,\s*'))) then
    execute format('alter role authenticator set pgrst.db_schemas = %L',exposed||',hackathon');
  end if;
end;
$$;
notify pgrst,'reload config';
notify pgrst,'reload schema';
commit;
