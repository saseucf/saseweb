# Hackathon event reminders

Apply `database/changes/add-hackathon-reminders.sql` after the existing event status migration. It adds `hackathons`, `events.hackathon_id`, the private delivery ledger, and two service-only RPCs. It seeds LumaHacks 2027 with no Discord destination; configure its channel and role in Admin → Events → Manage Hackathons before enabling the bot. These are Discord snowflake IDs, not names.

## Organizer workflow

Open Admin → Events → Manage Hackathons to create a hackathon or edit its name, unique lowercase slug, announcement channel ID, and reminder role ID. Enable Discord Developer Mode to copy those IDs. You may leave the destination unset while planning; reminders are skipped until both IDs are configured. Saving does not create Discord roles or assign members to them. The page uses admin authorization and database RLS; no additional migration is needed beyond the migration above.

In Admin → Events, choose an Event group when creating or editing a session. New hackathon sessions default to zero points unless explicitly overridden. Existing events and point values are preserved. Filter the admin list by hackathon or SASE chapter events. Publish sessions when ready; draft and cancelled sessions never qualify for reminders.

Hackathon sessions are excluded from the ordinary public event list/detail routes and SASE daily/weekly digests. No public hackathon schedule page is added here. Registration forms and submissions are unchanged.

## Deployment order

1. Apply the additive migration; do not execute the destructive baseline `database/schema.sql` against an existing database.
2. Configure LumaHacks' channel and reminder role. Invite the bot with access to send messages and embeds in that channel, and ensure it can mention that role.
3. Deploy this website and the matching Discord bot branch. The database migration must precede both because their queries now reference `hackathon_id`.
4. Set the bot's server-only `SUPABASE_SERVICE_ROLE_KEY` and `HACKATHON_REMINDERS_ENABLED=true`. Never put the service key in a `NEXT_PUBLIC_*` variable or browser code.
5. Stop older bot instances before starting the updated one. Verify worker logs and delivery records. Production deployment and real Discord test messages require a separate deployment step; neither is performed by local tests.

The worker ticks once a minute; it does not send on startup. It sends published sessions strictly in the future and within 60 minutes. Missed reminders can catch up until start time. A single event has one `starts_60_minutes` delivery identity even if rescheduled.

## Delivery outcomes and repair

- `pending`: unattempted; the worker refreshes snapshots from current event/configuration.
- `delivering`: claimed with a 30-second lease, one delivery per transaction.
- `delivered`: successful; never automatically resend.
- `failed`: a definite Discord 4xx rejection; retry after five minutes while still eligible.
- `unknown`: uncertain delivery or an attempted event changed; manual review only. Expired leases and ambiguous network/5xx failures also land here.

Inspect `event_reminder_deliveries` using trusted Supabase administration tools. Review `last_error`, timestamps, content and destination snapshots, and Discord itself before changing a record. Never bulk-reset `unknown` rows: the message may already exist. After independently verifying no delivery happened, an operator may reset the individual record to `pending`, set `attempt_count=0`, and clear claim/retry/error fields if a resend is wanted. Otherwise preserve the record. A success whose acknowledgement was lost may have no stored Discord message ID.

The SQL claim rechecks the event and hackathon under row locks. Changes after a claim cannot retract an in-flight Discord request. Message requests have a 15-second timeout with no automatic HTTP retry. Failed outcome writes are logged and the next poll quarantines the expired claim.

## Column cleanup

`events.reminded` is retained but no longer read or written by the updated bot. Remove it in a separate migration only after confirming all deployed consumers are updated; the legacy migration and baseline schema must be updated at that time. Other existing event fields support the website, membership points, RSVP, or check-in behavior and are retained.

## Local verification

- `npm test`: website behavior tests.
- `npm run typecheck`: TypeScript validation.
- `npm run test:reminders-db`: Docker must be running. Starts and removes an isolated PostgreSQL 18 container, with no published ports and no live Supabase credentials. Tests the actual migration, atomic claims, access policies, retry timing, edits, cancellations, and terminal states.

The database suite creates minimal Supabase-role and event fixtures. It validates PostgreSQL behavior directly; it does not exercise a deployed Supabase/PostgREST gateway or actual Discord permissions.
