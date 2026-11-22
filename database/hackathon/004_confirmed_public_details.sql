-- Date-only announcements do not invent an exact start time or application window.
begin;
alter table hackathon.portal_configuration add column if not exists public_details jsonb not null default '{}';
update hackathon.portal_configuration set public_details = '{
  "name":"LumaHacks",
  "starts_on":"2027-03-06",
  "ends_on":"2027-03-07",
  "rsvp_deadline_on":"2027-02-15",
  "contact_email":"ucfsase.tech@gmail.com",
  "discord_url":"https://discord.gg/wJvHPkbBN"
}'::jsonb where id=true;
commit;
