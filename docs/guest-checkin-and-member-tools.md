# Guest check-in and member tools

## Event scheduling and admin organization

Event creation now offers preset and custom durations, calculating the end time
from the chosen start without adding a database duration column. Manual end-time
entry remains available, and existing durations/point values are preserved when
opening an event for editing. New events default to 30 points; blank locations
save as `TBD`. Automatic duration uses elapsed minutes across midnight and DST.

Manage Events shows upcoming and ongoing events directly, with ended events in
collapsed folders by event type (including each workshop subcategory). Cards for
ended events use a light green background. Every minute, events that have ended
move into the past grouping. Searching checks titles, descriptions, locations,
types, hosts, dates, status, points, counts, and linked form titles. Matching
events from all folders appear in a flat list, prioritizing title matches.

Events and forms order saved edits newest first, then scheduled starts earliest
first. Unscheduled forms fall back to newest creation time. Existing form
`updated_at` and event `admin_logs` records supply edit times; event server writes
now explicitly record successful edits in that existing audit table. Historical
event edits that were never logged cannot be reconstructed and use date order.
No new database tables/columns or migration are required for these features.
The form builder also omits the unsupported empty academic-category field so
forms can be edited against the currently deployed schema.

Apply `database/changes/add_guest_checkin_rate_limit.sql` and then `database/changes/secure_roles_and_checkin.sql` to the existing Supabase database before deploying. Use these additive migrations; do not run the destructive reset script in `database/schema.sql`. The existing `add-event-status.sql` migration must already be applied. See `docs/account-checkin-fixes.md` for registration behavior, deployment steps, and review findings.

Configure server-only `SUPABASE_SERVICE_ROLE_KEY` and `BREVO_API_KEY`, the verified Brevo sender in `EMAIL_USER`, and the canonical application URL in `NEXT_PUBLIC_SITE_URL`. Add that site's `/auth/callback` URL to Supabase Auth's redirect allowlist. Never prefix service credentials with `NEXT_PUBLIC_`.

Event QR links open `/checkin/scan/[eventId]`. Signed-out attendees can enter a first name, last name, and email. New attendees receive an Auth account, its trigger-created profile, and a Brevo welcome email with a Supabase invitation link that leads to password setup. Existing profiles are reused without changing their details or issuing a login session. Guest participation is self-reported by email, so it does not verify identity or physical presence.

Guest check-in has no event date or time restriction and is disabled for cancelled events. Database-backed limits allow five attempts per email per ten minutes, plus 120 attempts per forwarded client IP per ten minutes when the hosting provider supplies that header. Deploy behind a provider that overwrites client IP headers. Attendance uses the existing unique event/member constraint and points trigger: retries cannot award extra points. If welcome delivery fails, account creation and attendance remain valid and the UI explains how to use Forgot password. No email delivery is claimed on failure.

`/admin/users` provides quick member creation and CSV export. The API independently verifies the signed-in administrator and exports every profile column with pagination. Formula-looking fields are escaped for spreadsheet safety. Existing email addresses are reused without modifying names, roles, or dues status.

Programs shows the top ten eligible members by participation points, with equal points sharing a competition rank. Only profiles with `role = 'member'` are eligible. Administrators are excluded in the database query before the top-ten limit is applied, and the public display and admin-only CSV use the same ranked results. Membership counts only eligible members with strictly more points; administrator accounts show “Not ranked” while retaining their own points total. The server selects only names, IDs, points, and eligibility role for the leaderboard; contact details are never included in its display or export. Configure the service-role key so these queries can work independently of member-only profile read policies.

Run `npx tsx scripts/check-leaderboard.ts` from the repository root for a read-only check against the configured Supabase project. It verifies eligibility and compares each displayed rank against the Membership counting rule, printing counts only. It does not create attendance records, change roles, or modify points.

Member and event QR codes support PNG and SVG downloads with a four-module quiet zone. Event display colors are configured in a separate Check-in appearance menu, linked from the admin check-in dashboard, event cards, and QR display. It controls the full display background, text, QR panel, and QR line/background colors. Settings save per event in the current browser and synchronize between tabs on the same origin; they do not change the database or synchronize across devices. Low-contrast selections remain visible with a warning in the appearance menu, rather than silently reverting. Event PNG/SVG downloads are also in that menu and use the displayed QR colors. The QR display fits below the navigation in one viewport, with details beside the code on laptops and a compact stacked layout on portrait phones. It omits the footer and sizes the QR square to the remaining display area; long titles are visually clamped with their full text available in the heading's title attribute. Form QR downloads retain PNG export and now include the same quiet zone. Test printed codes on actual phones before using a custom palette at an event.

Public-page ocean effects are decorative, preserve the normal pointer, and disable cursor tracking on touch devices. Reduced-motion preferences disable drifting, parallax, bubbles, and the cursor halo.

Before release, verify using a staging event and mailbox: new guest creation and welcome activation, returning guest check-in, duplicate check-in without extra points, cancelled/closed events, rate limits, member rank, admin-only CSV access, exports beyond 1,000 profiles, and QR downloads/scanning. Live account creation and email delivery were not exercised against production during implementation.

The public leaderboard loads current rankings on the server when the Programs page is opened or refreshed. There is no polling or background refresh on tab focus, visibility changes, or network reconnection. The dynamic page displays only member names, ranks, and participation points, with administrators excluded. Leaderboard queries, personal ranks, and About major demographics include both existing `user` profiles and newer `member` profiles through a shared explicit role allowlist. Unknown roles and administrators are excluded. If loading fails, the page asks the visitor to refresh and try again. The uncached `/api/leaderboard` endpoint also remains available with only the same public fields. No Realtime publication or broad profile read policy is required.

CSV downloads are administrator-only. Public About shows aggregated major counts and public Programs shows the top-ten visual, without download controls. `/api/admin/exports/leaderboard` provides the current top ten only after server authorization, and all existing private CSV endpoints remain protected. The photo wheel no longer pauses on hover; its explicit pause control, keyboard-focus pause, and reduced-motion behavior remain available.
