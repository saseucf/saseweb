# LumaHacks portal

An independent Next.js application in the same repository. It has its own layout,
navigation, styles, auth callbacks, and browser session. It imports the shared
backend adapter from `lib/hackathon` and uses the existing SASE Supabase project.
It never calls the club's enrollment, points, or welcome-email flows.

## Run from the repository root

```powershell
npm.cmd ci
npm.cmd run dev:portal
# http://127.0.0.1:3002

npm.cmd run build:portal
npm.cmd run start:portal
```

The launcher loads the root `.env.local`, then optional portal overrides from
`apps/hacker-portal/.env.local`. It does not copy credentials. In hosting, provide
the public environment variables normally; never put the service key in a
`NEXT_PUBLIC_` variable. `NEXT_PUBLIC_HACKATHON_SLUG` defaults to `lumahacks`.
The app can also be built directly with `next build apps/hacker-portal` when the
environment is already configured. Install dependencies using the repository's
root lockfile. Shared source outside this app directory must be included in the
deployment checkout.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Event date/location, application window, tracks/prizes, sponsors/partners, FAQ, socials/contact |
| `/login` | Shared-account sign-in, signup, Google/Discord, forgot password |
| `/auth/callback` | Portal-only PKCE email/OAuth callback, no club enrollment |
| `/reset-password` | Set a password after a recovery link |
| `/apply` | Verified-account application with catalog school selection and versioned consent |
| `/dashboard` | Application/RSVP, QR, countdown, guide/community links, Wi-Fi, announcements, schedule, teams, map/parking, profile/resume, perks |
| `/organizer` | Role-checked application review, QR scanner/manual check-in, event content editing |

Confirmed date-only public details are in `event-details.json` and the database
configuration: March 6-7, 2027, RSVP by February 15, 2027, the supplied contact
email, and Discord invite. They are displayed while operational setup is pending.
Actual event times, application windows, and venue details remain unset. Other
public and private content comes from the database; no fictional dates, prizes,
sponsors, credentials, or applications are seeded. Empty/loading/error states are
explicit. Hacker data is discarded when the account changes. The hub refreshes
every 30 seconds while visible and when the window regains focus. No Realtime
publication is required.

Hacker QR codes encode only their opaque token. The scanner accepts UUIDs only;
the database authorizes scans and deduplicates them. Resume downloads require
signed links and a second click, avoiding browser popup blocking. Sponsor/guide
URLs are restricted to HTTP(S). Organizer code uses only the signed-in user's
client; no service credentials are sent to the browser.

Sign-in/signup controls remain disabled until the account-isolation release
migration marks the backend ready. Direct application submission is also blocked
by the database until then. This prevents new portal signups from accidentally
creating club profiles while the old club deployment is still running.

## Release order

See [database setup](../../database/hackathon/README.md). The important order is:

1. Apply the additive `001_backend.sql` in the existing project (already applied
   through the Supabase connector on November 22, 2026).
2. Deploy the updated SASE app with explicit club profile enrollment.
3. Apply `002_account_isolation.sql` to switch signup handling safely.
4. Expose the `hackathon` API schema, preserving existing exposure and RLS.
   `003_expose_api.sql` is prepared; live execution awaits explicit approval.
5. Configure event data, school/country catalogs, terms, and hackathon staff.
6. Allowlist the portal's exact `/auth/callback` URLs in Supabase. Keep club
   callbacks and the existing Site URL. Provider setup stays shared.
7. Deploy this app to its own origin with the same public project configuration.
8. Smoke-test email verification, OAuth, RSVP, team joins, private resume upload,
   map navigation, and scanner camera permissions on the real deployment.

The portal code builds independently from the main SASE site. Do not replace the
club app's root routes with these pages. A separate host also needs HTTPS for
production camera access. Camera denial has a manual-token fallback.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run typecheck:portal
node --import tsx --test --test-concurrency=1 tests/*.test.ts
npm.cmd run build
npm.cmd run build:portal
node scripts/check-hackathon-setup.mjs
```

The setup checker reports missing backend readiness, event/catalog/terms data,
and API exposure without printing credentials. The database integration suite
and isolated test-engine instructions are in the database guide. Passing builds
and HTTP checks do not replace live authenticated browser smoke tests.
