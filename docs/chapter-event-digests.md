# Chapter event digests

Go to **Manage Events → Discord Event Groups** to create a group or update its
Discord channel and role IDs. Choose that group when creating or editing an
event. The event list marks upcoming published events that still need a group.
Existing events start unassigned and stay out of Discord digests until an
officer assigns them.

The bot sends each group its published events for the day at 9 a.m. Eastern.
The Sunday 6 p.m. Eastern digest covers the following Monday through Sunday.
Event start time determines which window an event belongs in. Digests read published rows from `public.events`. LumaHacks sessions live in
the separate `hackathon` schema.

## Rollout

1. Apply `database/changes/add-chapter-event-digests.sql` after the event
   status migration. It adds new tables and a nullable group column and
   preserves existing reminder flags.
2. Deploy the website and assign the groups and upcoming events you want to
   include. Verify the bot can send to the configured channels and mention the
   configured roles.
3. Switch to the companion bot version and stop instances using the old
   per-event and Monday reminder jobs. Configure the bot with
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_TOKEN` and
   the public HTTPS `SASE_WEBSITE_URL`.

Each group, digest kind, and start date can be claimed once. If a claim has
no delivery timestamp, check the channel and bot logs before posting a
replacement manually. The bot leaves that claim in place to prevent a repeated
role ping after an interrupted send.

Run `npm run test:digests-db` to check the migration in disposable PostgreSQL
using the chapter event schema. The test uses Docker
and does not connect to the website's database.
