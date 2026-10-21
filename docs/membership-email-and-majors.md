# Email matching and consistent majors

This change uses the existing tables and membership RPC. No database migration, reset, or bulk rewrite is needed.

## Membership

Opening or refreshing Admin → Membership payments makes an authenticated POST to synchronize eligible exact-email matches before loading the queue. Signing in (including after registration) starts a background check. Unpaid members also get an automatic check on their membership/profile page, on returning to the tab, and once a minute while the page is visible. Manual verification remains available.

Payments must come from the configured Zeffy campaign, have the configured dues amount/currency, and have no refunds. Emails are trimmed and compared without case. Names cannot authorize a match. Duplicate registered emails, manually unlinked payments, and payments assigned to another account stay for officer review. No active assignment is automatically transferred. Conflicting assigned payments remain visible in the default queue.

Admin assignments use the existing atomic `match_membership_payment` RPC. Self-service uses the existing service-side insert/update workflow with uniqueness protection and an ownership recheck; an interrupted profile update can be repaired on the next check. These self-service writes are separate requests, not a database transaction.

The read-only October 21 audit found 243 profiles, 31 provider payments, and 29 eligible dues payments. Twenty payments had exact registered-email matches; all twenty already had assignment records. One exact-email account was unpaid because its payment was actively assigned to a different account. No live records were modified during implementation.

## Majors

Registration, profile completion, and both profile editors share a native select (using the device's own mobile picker), with common majors first and an Other option. Recognized aliases normalize on save, including old profile values saved without changing the picker. Biomedical Sciences and Biomedical Engineering remain distinct.

Historical responses are normalized on read in both demographics pages, attendance CSV exports, and the check-in member display. Original stored responses are retained. Unrecognized and double majors are preserved rather than discarded. The public pie chart still groups majors outside its top seven into a single Other slice; the admin attendance demographics retain the full normalized breakdown. Explicit Other responses are counted only once.

Deploy the application code normally. No SQL from the repository is required for these membership/major changes.
