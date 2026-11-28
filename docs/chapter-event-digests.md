# Chapter event digests

All published chapter events share one Discord reminder channel and one opt-in role.
The daily digest covers today at 9 a.m. Eastern. The Sunday 6 p.m. Eastern
digest covers the following Monday through Sunday.
Event start time determines which window an event belongs in. Digests read published rows from `public.events`. LumaHacks sessions live in
the separate `hackathon` schema.

## Rollout

1. Apply `database/changes/add-chapter-event-digests.sql` after the event
   status migration. It adds the delivery table and service-only claim and completion functions.
2. Set the reminder channel, shared role, and bot settings channel IDs as documented in the bot README.
3. Switch to the companion bot version and stop instances using the old
   per-event and Monday reminder jobs. Configure the bot with
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_TOKEN` and
   the public HTTPS `SASE_WEBSITE_URL`.

Each digest kind and start date can be claimed once. If a claim has
no delivery timestamp, check the channel and bot logs before posting a
replacement manually. The bot leaves that claim in place to prevent a repeated
role ping after an interrupted send.

Run `npm run test:digests-db` to check the migration in disposable PostgreSQL
using the chapter event schema. The test uses Docker
and does not connect to the website's database.
