# October 20 GitHub workshop recovery

The officer supplied 25 unique attendees for SASE × KH GitHub Workshop, October 20, 2026, 5 PM, HEC 101. The source roster and its graduation terms/majors are retained in `lib/workshop-credit-roster.ts` without overwriting existing member profile responses.

The existing event `f367e520-8a9d-4228-9268-45747c423990` was incorrectly scheduled for November 10. With the officer's approval, its date was corrected to October 20, 5–6 PM Eastern (preserving its one-hour duration), retaining its 30-point value and both earlier attendance records.

## Applied live on October 21

- Kayla Tran: 50 → 80 points.
- Youssef Khairy: 0 → 30 points.
- Both Kevin Li accounts: 0 → 30 points each, as explicitly requested after identifying two matching accounts.
- The other 22 attendees have pending 30-point credit entries.

Before the first write, the recovery script saved every row from profiles (243), events (25), event_attendances (331), and admin_logs (16). The private JSON data snapshot and per-account results are in `.local-backups/github-workshop-2026-10-21T17-59-19-169Z/`, which Git ignores. This snapshot excludes schema, Auth, and storage; it is not a full PostgreSQL backup. No accounts, attendance records, or existing point balances were deleted or reset.

## Claims and retries

The existing `admin_logs` table stores one deterministic claim UUID per roster entry, with an empty actor for pending credit and the member's profile ID once reserved. There are 26 credit entries because the officer authorized both Kevin Li accounts. These records are shown explicitly as workshop credit in the admin audit-log page.

The server matches a unique complete name, ignoring case, whitespace, and accents (José/Jose). It does not match only a first name, guess misspellings, or choose among duplicate names. Kevin Li is restricted to the two explicitly approved profile IDs. An owned claim remains assigned even if the account later changes its name.

Reservation uses the audit row's primary key and a conditional update of its empty owner, preventing simultaneous accounts from claiming the same entry. A successful reservation creates a normal workshop attendance. The existing attendance trigger adds the event's 30 points atomically, and the existing unique `(event_id, user_id)` constraint prevents double awards. If recording attendance fails, the same owner can retry its reserved credit. Existing workshop attendance receives no extra points.

No new database schema or SQL migration is needed for this recovery. After application deployment, claims run after sign-in (including registration), profile completion/name updates, and when opening membership/profile pages. The server derives the signed-in profile ID and accepts no client-supplied name, target account, event, or point amount. Pending credits are already stored live; automatic signup claims require this application release.

## Operator commands

Run from the repository with `.env.local` configured. The service-role key stays server-side and is never printed.

```powershell
# Read-only preview; safe to repeat.
node --use-system-ca --import tsx scripts/recover-github-workshop.ts

# Already executed for this recovery. Only repeat deliberately:
# saves another pre-change data snapshot, corrects the event date, records any
# missing debts, and applies eligible attendance without duplicating points.
node --use-system-ca --import tsx scripts/recover-github-workshop.ts --apply
```
