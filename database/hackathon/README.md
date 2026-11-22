# Hackathon backend in the existing SASE database

Use the **existing SASE Supabase project**. The portal remains a separate website,
with its own application records and staff permissions, while sharing Auth accounts.
No live database has been changed by this code update. The previous standalone
migration was never applied; run only this revised version, once.

## Accounts and foreign keys

`hackathon.applications.user_id` references `auth.users.id`, the same identity
referenced by `public.profiles.id`. Existing members sign in with their existing
password/provider and submit an application under their current user ID. No account
copying, email-based matching, or synchronization is necessary. External attendees
also use `auth.users`, without a `public.profiles` row unless they join the club.

All hackathon tables and application RPCs live in the `hackathon` schema inside
this database. Club tables stay in `public`. This prevents collisions with existing
or future club tables named `teams`, `sponsors`, `applications`, etc. Staff roles,
application status, QR credentials, and attendance are separate from club roles,
paid membership, points, and attendance.

New account creation no longer automatically means club enrollment:

- Existing members and their profile values are preserved.
- New email/provider signups in the hacker portal do not create a club profile.
- Explicit club registration (`signup_profile_complete`) and club invitations
  (`account_context: club`) retain profile creation through the existing handler.
- Signing in through the club website enrolls a missing club profile through
  `public.ensure_club_profile()`. This only creates the caller's ordinary profile;
  it cannot set admin privileges, paid membership, or points. The hacker portal
  never calls this function. Existing member records are never overwritten.
- The old `mark_luma_hacks_participant_on_submission` trigger is removed so
  preregistration answers cannot modify club profiles. Historical submissions and
  profile columns remain intact. Preregistrations are not silently converted into
  verified applications or consent records. Do not reapply the old
  `database/changes/luma_hacks_preregistration.sql` migration afterward.

## Apply once

1. Deploy this code update to the SASE site first, particularly
   `lib/member-session.ts` and `lib/member-onboarding.ts`. Existing sign-ins continue
   to work before the migration because their profiles already exist or are still
   created by the old trigger. Deploying the migration first could temporarily
   leave new club OAuth accounts without a profile on older code.
2. In the **existing project's** SQL editor, run `001_backend.sql` once as
   `postgres`. It is transactional and requires the existing `public.profiles`
   table and `public.handle_new_user()` handler. It adds the new schemas, adjusts
   the signup trigger, and provides the explicit club enrollment RPC. Do not rerun
   `database/schema.sql`: that file drops club tables. No rollback of the old
   standalone migration is needed because it was never applied.
3. In Supabase API settings, **add `hackathon` to Exposed schemas**, preserving
   `public` and any other existing entries and their order. Do not expose
   `hackathon_private`. See [Supabase custom-schema setup](https://supabase.com/docs/guides/api/using-custom-schemas).
4. Configure the portal with the same `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` as SASE, as shown in this directory's `.env.example`.
   Keep `SUPABASE_SERVICE_ROLE_KEY` server-only if automation needs it.
5. Add the portal's own callback URLs to the existing Auth redirect allowlist.
   Preserve SASE's Site URL and callbacks. Portal email verification/signup links
   should explicitly specify a portal `emailRedirectTo`; portal OAuth should
   specify its own `redirectTo`. Never send portal sign-ins to the SASE club
   callback, because that callback intentionally enrolls club members. Use the
   existing Auth provider and SMTP settings. Applications require verified email.
   Portal signup metadata must not include the club enrollment markers above.
6. Insert a draft `hackathon.hackathons` record with the actual dates, venue,
   contact, application window, RSVP deadline, and links. All timestamps include
   a timezone. `timezone` controls display; timestamps use `timestamptz`.
7. Bootstrap hackathon staff using an existing Auth user ID. Being a club admin
   does not automatically grant hackathon admin access:

   ```sql
   insert into hackathon.hackathon_staff(hackathon_id,user_id,role)
   values ('EVENT-UUID','EXISTING-AUTH-USER-UUID','admin');
   ```

8. Import the approved school list into `hackathon.schools` (`id`, `name`,
   `source_version`) and ISO alpha-2 countries into `hackathon.countries`
   (`code`, `name`). No fabricated school list is seeded.
9. Insert `hackathon.application_terms` with current organizer/MLH-approved
   checkbox wording and version; set `is_current=true`. The two mandatory choices
   must be true. Marketing is recorded independently and may be false. This
   storage model is not a certification of current MLH requirements.
10. Add and publish tracks/prizes, sponsors/partners, FAQs, maps, locations and
    schedule entries under `hackathon`. Publish the event when ready. Add private
    `hacker_resources` for Wi-Fi and `perks` for participant-facing redemption
    information with explicit unlock times. Never store server API secrets there.
11. Run the checks below and smoke-test both sites with existing club members and
    external attendees before opening applications. The portal UI and hosting are
    separate work; this change provides the backend and client adapter.

## API contract

Supabase exposes the tables and RPCs through its REST API after the schema is
exposed. The adapter uses `client.schema("hackathon")` for data/RPC calls and the
shared project's Auth/Storage services. Raw REST reads require
`Accept-Profile: hackathon`; writes and RPCs require `Content-Profile: hackathon`.
Use the publishable key plus the signed-in user's access token. Unqualified table
names below refer to `hackathon`, not `public`. The adapter is
`lib/hackathon/api.ts`:

```ts
import { createHackathonClient } from "@/lib/hackathon/client";
import { hackathonApi } from "@/lib/hackathon/api";

const client = createHackathonClient(); // same project/accounts, separate portal session
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
Anonymous applications are deliberately unsupported. The same accounts work on both
sites, but login sessions are not automatically shared across separate domains.

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
Auth/Storage stubs plus the real club profile schema and protection triggers. It
checks existing-account foreign keys, preservation of club profiles/attendance,
external signup isolation, explicit club enrollment, SQL syntax, RLS/grants, consent, applicant status,
cross-account privacy, team capacity, duplicate scans, and resource unlock rules.
Supabase-hosted OAuth/email delivery and actual Storage upload/MIME enforcement
still require a staging project smoke test with anonymous, hacker, volunteer and
admin sessions. The stubs do not validate the hosted services.

Not configured here: live migrations/API settings, actual event data, approved
catalogs/terms, portal callback URLs, email notifications, portal UI, or hosting.
No new Supabase project, separate account directory, or SSO service is required.
