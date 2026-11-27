# Chapter event digests

Under **Manage Events ? Discord reminder channels**, configure a Discord channel
and role for Tech, Pro-Dev, Pre-Health, and General. Workshop reminders follow
the subcategory selected in the event form. All other events, including older
workshops without a subcategory, use General. Existing events use their saved
event type automatically.

The bot sends each group its published events for the day at 9 a.m. Eastern.
The Sunday 6 p.m. Eastern digest covers the following Monday through Sunday.
Event start time determines which window an event belongs in. Digests read published rows from `public.events`. LumaHacks sessions live in
the separate `hackathon` schema.

## Rollout

1. Apply `database/changes/add-chapter-event-digests.sql` after the event
   status migration. It adds the destination and delivery tables.
2. Deploy the website and configure all four destinations. Verify the bot can send to the configured channels and mention the
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
