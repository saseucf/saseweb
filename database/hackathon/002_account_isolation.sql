-- Apply only AFTER deploying the updated SASE club login code.
begin;
-- Account creation is not club enrollment. The existing profile handler remains
-- intact, but only explicit club registrations/invitations invoke it at signup.
-- Provider signups from either site have no marker; club OAuth login explicitly
-- enrolls through ensure_club_profile after authentication. Metadata only opts
-- into ordinary membership, never elevated roles, payment status or club points.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row when (
  NEW.raw_user_meta_data->>'signup_profile_complete' = 'true'
  or NEW.raw_user_meta_data->>'account_context' = 'club'
) execute function public.handle_new_user();

-- Legacy preregistration must no longer copy hackathon answers into club profiles.
-- Preserve historical submissions and profile values; do not infer applications
-- or consent from unverified preregistration emails.
do $$
begin
  if to_regclass('public.form_submissions') is not null then
    execute 'drop trigger if exists mark_luma_hacks_participant_on_submission on public.form_submissions';
  end if;
end;
$$;
update hackathon.portal_configuration set account_isolation_ready=true where id=true;
commit;
