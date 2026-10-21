# Account permissions and check-in fixes

## Live inspection: October 21, 2026

The earlier blanket migration recommendation below is superseded by this live
inspection. Do not apply all four files as a routine repair.

Read-only access succeeded using Node's `--use-system-ca` option. No production
rows, settings, roles, functions, or policies were changed during inspection.

- 243 profiles: 224 `user`, 17 `admin`, and 2 `member`.
- The live `profiles.role` default is `user`. There is no `profiles.is_admin` column.
- Both Auth accounts created on October 20, 2026, Eastern Time currently have
  profile role `user`, Auth role `authenticated`, and no admin role in their
  user/app metadata. The October 19 accounts inspected are also `user`.
- All 25 events already have status `published`; do not rerun the status migration.
- There are 330 attendance records.
- `guest_checkin_attempts` is absent, and the service-role OpenAPI schema does not
  list `claim_guest_checkin_attempt`. Commit `bc17044` introduced this dependency
  in guest check-in. Installing `add_guest_checkin_rate_limit.sql` addresses this
  confirmed missing dependency; it does not require the broader role migration.
- Email confirmation is currently enabled in Supabase Auth.
- The recent signup code examined does not explicitly assign admin roles.
  Recent persisted role audit records do not show an October 20 account being
  promoted. Current state and audit records cannot prove every historical state.

The recursive legacy-flag policy discussed later was found in repository SQL;
it has not been demonstrated in the live database. The broader migrations were
prepared before live access was established. The October 20 demotion has no
currently identified admin account to correct and should not be run based only
on the earlier assumption. The live database uses `user` for ordinary accounts;
there is no need to convert those existing profiles to `member`.

The already identified event server-action authorization gap remains a real code
issue, independent of whether profiles have admin roles. The local application
fix adds explicit authorization before service-role event writes.

Deployed trigger/function bodies and RLS policies cannot be read through the
currently exposed REST schema. `database/diagnostics/account_permissions_readonly.sql`
contains catalog-only queries for the SQL Editor to inspect them without writes.
The reported UI/admin behavior still needs identification before attributing it
to a specific recent commit or changing production role rules.

### Reported account and session display correction

The user identified a particular October 20 signup and reported seeing admin
navigation/dashboard. A read-only lookup found its unchanged profile role `user`,
Auth role `authenticated`, no recorded sign-in, and no profile-role audit entries.
This supports investigating a retained browser session/display; it does not prove
which session was active when the behavior occurred.

The navigation had an asynchronous race: an older admin profile lookup could
complete after a newer member/sign-out lookup and overwrite the displayed role.
Event controls and admin layouts also retained authorization after their initial
mount. A shared role tracker now clears previous privileges immediately, ignores
outdated responses, verifies the Auth user before loading their role, and follows
auth events. Admin dashboard gates now respond to session changes. Regression
tests reproduce out-of-order admin/member responses and logout during a pending
admin lookup. Sign-in callbacks also refresh server-rendered routes after account
changes. All 81 tests pass, and TypeScript and targeted ESLint checks pass.
These application corrections require no database migration and have not yet
been deployed or verified in the user's browser.

## Release steps

### Confirmed event-creation failure

A subsequent read-only live check confirmed that `events.academic_field_id` and
`public.academic_fields` do not exist. The event form introduced in `bc17044`
always sent `academic_field_id: null`, even when no category was selected. The
database rejects that payload, and throwing its error from a Server Action
caused a production 500 with a redacted error/digest instead of a useful message.

The application correction omits category data when the optional category control
is unavailable. Server writes also retry a rejected null category without that
column, only for the specific missing-column error. Selected categories and
unrelated failures are never silently discarded or retried. Event mutations now
return explicit success/error results, retain admin authorization, validate inputs,
and keep failed forms open with readable messages. Cache refresh errors after a
committed save no longer report a failed save and encourage duplicate creation.
No database migration is needed to save events without categories. No live test
events were created, edited, or deleted during diagnosis.

For the inspected live database, the only confirmed missing dependency is
`database/changes/add_guest_checkin_rate_limit.sql`. Install it in the Supabase
SQL Editor before deploying the guest check-in and password registration routes.
This adds a rate-limit table/function and does not rewrite member data.

Event status is already installed. Do not reapply its migration as a routine
repair. The optional `secure_roles_and_checkin.sql` hardening and targeted
`revoke_oct20_2026_admins.sql` remediation are retained for operator review, but
are not release prerequisites or instructions to change current roles. Live
inspection found no October 20 administrator account to demote.

Do not run `database/schema.sql` against an existing database: it drops tables.
The role/check-in migration does not delete or rewrite existing member or
attendance rows. It snapshots them inside its transaction and checks that all
existing values and records are preserved before committing; a mismatch aborts
the entire migration. It preserves the actual member count at execution time,
including all 240 current members and any who join before it runs. Writes pause
briefly while the migration holds its table locks. Take a database backup before
applying production migrations.
Deploy the application with the server-only `SUPABASE_SERVICE_ROLE_KEY` configured.
The host must overwrite `x-forwarded-for` rather than trust a client-supplied value.

New email/password registrations use a rate-limited server endpoint that creates
an email-confirmed Auth account, then signs in with the chosen password. No
confirmation email or dashboard configuration change is needed for this flow.
The existing verification recovery UI remains for previously unconfirmed accounts.
An existing account cannot be claimed or have its password changed by registering
again. Google/Discord still use the provider's normal sign-in flow.

If the optional hardening migration is deliberately installed, new profiles are forced to member, unpaid, and zero points in the database,
including OAuth, invitations, and profile recovery. Editable metadata cannot
assign roles. Administrator promotion requires an explicit update by an existing
administrator, the service role, or the database operator. The legacy `is_admin`
flag never independently authorizes access. Existing flags are retained without
rewriting rows; subsequent profile updates synchronize the flag with `role`.

The general role/check-in migration preserves existing administrator roles.
The separate October 20 correction demotes admin accounts whose
`auth.users.created_at` falls within October 20, 2026 in `America/New_York` and
clears any legacy admin flags for accounts created that day. Other dates retain
their roles. It does not delete accounts or reset points, dues, or attendance.
It verifies the expected profile changes and unchanged attendance before commit.
These SQL migrations have not been executed or validated against a live database.
Review any remaining administrator accounts in the dashboard:

```sql
select id, email, role, created_at
from public.profiles
where role = 'admin'
order by created_at desc;
```

Demote accounts that were not explicitly appointed using Manage Users, or an
operator's explicit SQL update by account ID. Do not bulk-demote every admin.

## Check-in behavior

There is no date or time window. Cancelled and missing events are blocked.
Request-rate limits remain to prevent account-creation abuse. A duplicate member
check-in is displayed as success and does not award points twice. Failed member
check-ins have a retry button and release the busy state even after a network error.
The older recursive profile policy and the attendance policy now both use the
same non-recursive role check, fixing two code-level causes of check-in failures.

## Broader review

The review covered API handlers, server actions, authentication/profile flows,
database policies/triggers, check-in paths, and responsive page styles.
Additional corrections include server-side admin checks before event writes,
verification that role updates actually returned a saved row, fail-closed service
client configuration, protection against direct member edits to points/dues, and
payment amount/campaign validation covered by existing failing tests.

Remaining findings for follow-up:

- The public `/api/email` handler accepts arbitrary recipients and HTML-interpolated
  names/event titles without authentication or durable rate limits. It needs a
  server-authorized sending flow and HTML escaping.
- Automatic dues matching accepts a name match; names are editable. Requiring
  email alone also does not establish ownership when signup intentionally skips
  verification. Payment assignment needs proof of payment or officer review.
- Self-service payment matching inserts a match and updates dues in separate
  operations, so a partial failure can leave inconsistent status. Move both writes
  into one authorized database transaction.
- Feedback update policies currently allow changing attendance identity/event
  columns. Restrict updates to feedback fields at the database boundary.
- RSVP read access is public in the base schema. Confirm whether publishing
  attendee identifiers is intended and restrict the policy if it is not.

Live database policies, existing admin assignments, production check-in, signup,
email delivery, and phone rendering could not be verified in this session. HTTPS
access to the configured project failed certificate/connection validation; no
browser or local PostgreSQL/Docker service was available. The migration remains
unapplied, and the exact deployed causes require verification after release.

## Local validation

All 77 unit tests pass, including new registration tests for confirmed accounts,
untrusted privilege fields, request limits, and existing-account rejection.
TypeScript and ESLint on the changed TypeScript files pass. Production compilation
also succeeds; database-backed rendering reports the local HTTPS certificate
problem described above. No live accounts or attendance records were created.
