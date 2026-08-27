# Membership Integration Review Packet

## Status

- Local branch: `codex/zeffy-membership`
- Intended base: `origin/dev` at `302d9b7`
- Local head: the commit containing this packet; run `git rev-parse --short HEAD` for its current hash
- Branch shape: 9 commits ahead of `origin/dev`, 0 commits behind
- Conflict check: Git merge simulation is clean against current `origin/dev` and `origin/main`
- Delivery state: local only; no push, pull request, deployment, or Vercel environment change was made
- Unrelated work: the untracked `style.md` file was not edited or committed
- Live provider state: unverified until `ZEFFY_API_KEY` and `ZEFFY_CAMPAIGN_ID` are supplied

## Reviewer FAQ

### Why does this not match people automatically by phone, email, or name?

Those fields are useful evidence but are not durable identities: people change phone numbers, use a different checkout email, share names, or omit profile fields. This release displays Zeffy's buyer details next to searchable member details, but an administrator makes the final association. That avoids silently granting membership to the wrong account.

### Why keep both `profiles.paid_member` and a payment-match table?

`paid_member` preserves the simple boolean the current site needs. `membership_payment_matches` records why it became true, who assigned it, which provider payment was used, and whether the assignment was later unlinked. The table is provider-neutral so a later Stripe migration does not require redesigning membership history.

### Can a browser invent a successful Zeffy payment?

No. The browser submits only a Zeffy payment ID and member UUID. The protected server route checks the administrator again, fetches the configured campaign's successful payments directly from Zeffy, validates amount/currency/refund state, and passes trusted fields to an atomic database function.

### What happens while the Zeffy API credentials are missing?

The member page can still show the public hosted checkout link when its public URL and dues settings are configured. The admin payment workspace returns a safe not-configured state. Secrets and provider error bodies are not sent to the browser.

### Does unlinking refund a payment?

No. Unlinking only reverses the local association and keeps an audit record. It does not modify the Zeffy transaction; the UI says this before confirmation.

### What changes when the club moves to Stripe?

Replace the server-side provider adapter and begin writing `payment_provider = 'stripe'`. The audited match model, admin workflow, and current membership status can remain. A Stripe webhook can later automate ingestion without using names as identity keys.

## Plain-English Promise

Signed-in members can see their real membership status and open the official $25 USD 2026-2027 Zeffy dues form. Administrators can review successful payments, see identifying evidence, explicitly assign one payment to one unpaid member, inspect completed assignments, and undo a mistaken assignment. Every assignment and reversal is authorized and audited.

## What Changed

The branch changes 23 files: 14 product/data implementation files, 3 automated test files, 4 configuration/dependency files, and 2 review/product-context documents. The large lockfile diff is mainly the safe Next 15 patch upgrade and transitive vulnerability updates.

The branch does one coherent thing: it adds a manual, auditable membership-payment reconciliation flow. It deliberately does not add webhooks, automatic matching, embedded checkout, refund automation, a Stripe integration, or a new membership-tier model.

## Product Decisions

Locked for this release:

- $25 USD dues for the 2026-2027 membership period
- Hosted Zeffy checkout, not an embedded payment form
- Manual administrator assignment; no phone/email/name auto-match
- Unmatched payments shown by default; matched payments behind a checkbox
- Only unpaid members can be selected
- Explicit confirmation before assignment and unlink
- `paid_member` remains the current source for the member-facing status

Known follow-ups, not hidden requirements:

- Add Zeffy credentials and campaign ID in the deployment environment.
- With no webhook, an external refund does not automatically unset `paid_member`; an officer must review and unlink it.
- `paid_member` is not school-year-specific. Before the next renewal cycle, derive an active entitlement from membership-period records or add an explicit active-period field.
- Provider polling currently happens when the admin opens or refreshes the workspace. A future webhook/ingestion table can remove that dependency.
- The remaining npm audit finding is Next 15's bundled PostCSS. npm only offers a breaking Next 16 upgrade; that migration was intentionally kept out of this release.

## Cast of Entities

- **Zeffy payment**: read-only provider data for one successful transaction.
- **Profile**: the site's member account; `paid_member` is its simple current status.
- **Payment match**: an audited local record connecting one provider payment to one profile for one membership period.
- **Active match**: a match whose `unlinked_at` is null.
- **Unlink**: a local reversal that preserves history and does not refund the payment.
- **Membership configuration**: server settings for period, campaign, expected amount, and currency.

## Files Worth Reviewing First

1. `database/changes/add-membership-payment-matches.sql`
   Owns the durable rules: one active assignment per provider payment, one active assignment per member/period, RLS, admin checks, atomic match/unlink behavior, and audit fields.

2. `lib/admin-membership-core.ts`
   Owns the use cases independent of Next.js and Supabase: authorization-first execution, payment eligibility, unmatched filtering, trusted re-fetch before assignment, and stable errors.

3. `lib/zeffy-core.ts`
   Owns the provider boundary: Bearer-authenticated server requests, cursor pagination, response validation, campaign/currency checks, refund totals, and safe receipt URLs.

4. `app/api/admin/membership-payments/route.ts` and `app/api/admin/membership-payments/[matchId]/route.ts`
   Own the HTTP boundary. Confirm that administrator authorization occurs before configuration, provider, or database access and that responses are non-cacheable and sanitized.

5. `components/admin/membership-reconciliation.tsx`
   Owns the officer workflow and its explicit confirmation states. Review the unmatched-first list, member search evidence, assignment confirmation, matched visibility toggle, and unlink warning.

6. `app/membership/page.tsx`
   Owns the member promise: real RLS-backed status, contact evidence, honest manual-review language, and a validated hosted Zeffy link.

The three files in `tests/` are the fastest executable description of the intended provider, API, and checkout behavior.

## Responsibility and Security Review

- Zeffy API access stays in server-only modules; the only public Zeffy value is the hosted checkout URL.
- Admin page protection is backed by route-level authorization and database-level `is_admin()` checks.
- Members cannot set their own `paid_member` flag through the normal profile update policy.
- Matching and profile mutation happen in one database transaction.
- Partial unique indexes prevent duplicate active payment or member-period assignments under concurrent requests.
- Provider response fields are parsed as untrusted input. Invalid pages, dates, campaign IDs, currencies, cursors, and receipt URLs fail closed.
- The browser cannot submit amount, currency, campaign, or payment timestamps as trusted facts.
- Unlink history is retained with actor, timestamp, and optional reason.
- No credential-like values were found in the branch scan.

The main code seam to watch is `profiles.paid_member`: it remains a convenient current-state projection while the payment-match table is the audit source. Future renewal logic must update that projection deliberately instead of treating it as lifetime membership.

## Proof Already Run

- `npm test`: 22 of 22 tests pass. These cover authorization short-circuiting, unmatched filtering, unpaid-member selection, eligibility/refund rejection, trusted payment re-fetch, conflict mapping, unlink validation, safe HTTP errors, checkout-host validation, missing configuration, pagination, malformed provider data, campaign/currency isolation, and HTTPS receipts.
- `npm run typecheck`: passes.
- `npx eslint app components lib tests`: passes for application source and tests.
- `git diff --check`: passes.
- `npm run build`: succeeds with Next 15.5.24. It still prints the pre-existing `/admin/events` dynamic-cookie warning, but exits successfully.
- Responsive signed-out navigation checks at 375, 768, 1024, and 1440 pixels showed no horizontal overflow; mobile/desktop navigation switched at the expected breakpoint and exposed the Membership link.
- Protected-route checks confirmed `/membership` and `/admin/membership` redirect signed-out users to login.
- Git merge simulation reports no current textual conflict with `origin/dev` or `origin/main`.
- Supabase migration was applied and its table, policies, functions, indexes, and normalized `paid_member` contract were verified.

Potential false-green areas:

- A real Zeffy payment list cannot be exercised until the API key and campaign ID exist.
- Authenticated paid/unpaid member states and the full admin assignment dialog were not browser-tested with live accounts; their domain logic is covered by automated tests.
- No deployed Vercel environment or production flow was changed or tested.
- CI has not run because the branch was not pushed.

## Morning Review Checkpoints

1. Read the SQL functions and confirm the club wants unlinking to preserve history without refunding.
2. Read the eligibility rules and confirm exactly $25 USD is correct for every payment in this Zeffy campaign.
3. Review the admin dialog copy and verify an officer can distinguish members using name, email, and phone evidence.
4. Review the member page language and confirm the manual confirmation delay is honest for your process.
5. Add the missing environment values locally, then perform the live checklist below.
6. Only after those checks, decide whether to push and open a PR against `dev`.

## Live Checklist After Credentials Arrive

Set values without committing secrets:

```text
NEXT_PUBLIC_ZEFFY_MEMBERSHIP_URL=https://www.zeffy.com/en-US/ticketing/society-of-asian-scientists-and-engineerss-memberships
ZEFFY_API_KEY=<secret>
ZEFFY_CAMPAIGN_ID=<campaign id>
ZEFFY_EXPECTED_AMOUNT_CENTS=2500
ZEFFY_EXPECTED_CURRENCY=USD
MEMBERSHIP_PERIOD=2026-2027
```

Then verify:

1. An unpaid signed-in member sees "No payment confirmed yet" and the hosted checkout opens the expected Zeffy campaign.
2. An administrator sees successful unmatched payments by default.
3. Wrong-amount or refunded payments cannot be assigned.
4. Searching by a member's name, email, or phone finds the correct unpaid profile.
5. Assigning a payment marks that profile paid and moves the payment out of the default queue.
6. Enabling "Show matched payments" reveals the assignment.
7. Unlinking it records the reversal, returns the payment to the unmatched queue, and resets the member when no other active match exists.
8. A non-admin cannot load or mutate the workspace.

## Local Commit Series

1. `5610372` — database match records
2. `461d51c` — existing membership-status normalization
3. `8082c93` — server-only Zeffy client
4. `06bf5d0` — protected admin reconciliation API
5. `edb0cb4` — HTTPS-only receipt hardening
6. `0d49fd9` — admin membership workspace
7. `32fb521` — member dues page and navigation
8. `7c8e8cf` — dependency, accessibility, and release hardening
9. Final `HEAD` — this local review packet

## Agent Read

Clean enough for your local review. The architecture is intentionally conservative for a one-day MVP: humans make identity decisions, the server verifies payment facts, and the database preserves an audit trail. Do not treat it as live-complete until the Zeffy credentials and authenticated browser checklist are verified. No split is recommended before review; the phase commits already make the large branch inspectable.
