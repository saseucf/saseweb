# Standalone hackathon backend

This backend belongs in a **new Supabase project**, not the SASE production project.
It does not depend on SASE profiles, club membership, points, forms, or auth triggers.
No live project has been created or migrated by this change.
The migration refuses to run if it detects the existing SASE profile/attendance tables.

## Provision

1. Create a Supabase project for the hacker portal. Keep its credentials separate.
2. Run `001_backend.sql` once in its SQL editor as `postgres`. It is transactional;
   do not run `database/schema.sql` or the SASE migrations in this project.
3. Configure Supabase Auth: portal Site URL, allowed redirect URLs, email
   verification, production SMTP, desired OAuth providers, and signup abuse limits.
   The application RPC requires a verified account email.
4. Copy the variables in this directory's `.env.example` into the portal environment.
   `lib/hackathon/client.ts` deliberately has no fallback to SASE credentials.
5. Insert a draft `hackathons` record with the actual dates, venue, contact,
   application window, RSVP deadline, and links. All timestamps include a timezone.
   `timezone` controls display; timestamps are stored as `timestamptz`.
6. Create an organizer account through Auth, then bootstrap its permissions in the
   SQL editor. Use actual UUIDs:

   ```sql
   insert into public.hackathon_staff(hackathon_id,user_id,role)
   values ('EVENT-UUID','AUTH-USER-UUID','admin');
   ```

7. Import the approved MLH school list into `schools` (`id`, `name`,
   `source_version`) and ISO alpha-2 countries into `countries` (`code`, `name`).
   No fabricated or incomplete school list is seeded. Import these before launch.
8. Insert `application_terms` with the current organizer/MLH-approved checkbox
   wording and version; set `is_current=true`. The two mandatory choices must be
   true; the marketing choice is recorded independently and may be false. These
   fields are a storage model, not a certification of current MLH requirements.
9. Add and publish tracks/prizes, sponsors/partners, FAQs, maps, locations, and
   schedule entries. Set the event's `is_published=true` when ready. Add private
   `hacker_resources` for Wi-Fi and `perks` for sponsor redemption information,
   with explicit unlock times. Store participant-facing redemption codes only,
   never your own server API secrets.
10. Run the verification below, then connect the separate portal UI using the
    client and API adapter. No SASE page, middleware, or auth flow is changed.

## API contract

Supabase exposes the tables through its REST API and functions through `/rest/v1/rpc`.
Use the project's publishable key plus the signed-in user's access token. The
portable TypeScript adapter is `lib/hackathon/api.ts`:

```ts
import { createHackathonClient } from "@/lib/hackathon/client";
import { hackathonApi } from "@/lib/hackathon/api";

const client = createHackathonClient(); // create once per browser app/session
const api = hackathonApi(client);
const landing = await api.landing("your-event-slug");
// Sign in using client.auth, then:
const dashboard = await api.dashboard(landing.event.id);
```

| Portal feature | Source / mutation |
| --- | --- |
| Public date, venue, Apply window, social/contact | `hackathons`, `landing(slug)` |
| Tracks/prizes, sponsors/partners, FAQs | `tracks`, `sponsors`, `faqs` |
| Application form catalogs | `schools`, `countries`, current `application_terms` |
| Apply | `submitApplication`; verified email and timestamps supplied by database |
| Application status & RSVP | `applications`, `setStatus` |
| Personal QR | Owner's `applications.qr_token`; encode only token, never PII |
| Organizer scanner | `scan`; admin/volunteer only, duplicate scans are idempotent |
| Guide, Discord, Devpost | Event's `guide_url`, `discord_url`, `devpost_url` |
| Schedule, maps, parking | `schedule_events`, `locations`, `map_floors`, event parking text |
| Countdown | `hacking_starts_at` / `hacking_ends_at`; compute in UI, no timer writes |
| Team formation | `createTeam`, `joinTeam`, `leaveTeam`; max four, one team per edition |
| Teammates | `get_teammates`; names only, no emails/resumes/QRs |
| Shirt, diet, phone, names | `updateProfile` |
| Resume | `uploadResume`; private PDF, maximum 5 MB, 60-second signed downloads |
| Wi-Fi / perks | Confirmed attendees only, enforced database unlock time |
| Live updates | Refetch dashboard on focus and at a suitable polling interval |

The schema does not enable Realtime automatically; polling works without it.
If adding Realtime later, explicitly configure publication and recheck subscription
authorization. An application is unique per verified account per hackathon.
Anonymous applications are deliberately unsupported.

## Permissions and workflows

- Public readers see only published event content plus school/country/terms catalogs.
- Applicants see their own application, audit history and attendance. Teammates
  see names through the dedicated RPC, not each other's application records.
- Admins review applications through `setStatus` and edit event content using
  ordinary authenticated Supabase writes. Sensitive tables have no client write
  grants. Volunteers can scan, but cannot read application PII; mentors do not
  inherit scanner or reviewer permissions.
- Use the trusted SQL editor or a server-only service client to manage staff,
  terms, school/country catalogs, and additional event editions. Staff cannot grant
  themselves privileges through the browser. Protect any future server admin API.
- Organizer decisions are `applied/accepted/waitlisted/rejected` to
  `accepted/waitlisted/rejected`. Only the applicant confirms an accepted offer
  before the deadline or withdraws. Withdrawal removes team membership; an empty
  team is removed. Reapplication after withdrawal requires an explicit future
  workflow and is not silently allowed.
- Team invite codes are visible only to teammates/admins, not a public team
  directory. Codes are random eight-character values. Rate-limit join attempts
  at the gateway before public launch. Unique/foreign-key constraints keep users
  and related records within one event. Database locking protects the last slot.
- QR codes are bearer credentials for scanning: keep them private. General
  admission and activity attendance each have separate uniqueness indexes.
- Resume objects use `EVENT_UUID/USER_UUID/RANDOM_UUID.pdf`. New uploads use new
  paths; no overwrites. Replaced files need periodic cleanup. Owners and event
  admins can obtain signed downloads. Sponsors have no resume access.
- Public assets such as logos and floor plans use externally hosted URLs; put
  those assets in your chosen public object storage. Wi-Fi and perk codes never
  belong in public event rows.

## Verification

`npm.cmd run typecheck` checks the adapter in this repository.
For the database integration suite, install an isolated test dependency without
changing the app's installed packages or manifest/lockfile:

```powershell
$testDeps = Join-Path $env:TEMP 'hackathon-db-tests'
npm.cmd install --prefix $testDeps --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
$env:HACKATHON_PGLITE_MODULE = Join-Path $testDeps 'node_modules/@electric-sql/pglite/dist/index.js'
node scripts/test-hackathon-db.mjs
```

The suite runs the real migration in embedded PostgreSQL with minimal Supabase
Auth/Storage stubs. It exercises SQL syntax, RLS/grants, consent, applicant status,
cross-account privacy, team capacity, duplicate scans, and resource unlock rules.
Supabase-hosted OAuth/email delivery and actual Storage upload/MIME enforcement
still require a staging project smoke test with anonymous, hacker, volunteer and
admin sessions. The stubs do not validate the hosted services.

Not provisioned here: a hosted Supabase project, production credentials, actual
event data, MLH-approved catalogs/terms, email notifications, portal UI, or hosting.
Existing SASE accounts are not automatically copied or linked. A standalone
project uses separate accounts; shared sign-in would be a separate SSO decision.
