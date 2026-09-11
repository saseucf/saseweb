# Contact & Help: operation and handoff

The public page is `/contact`. Its form submits to `POST /api/contact`. Every request goes to **ucf@saseconnect.org**, with the visitor's validated address in Reply-To. No account is required. The officer inbox is the record of the conversation; this feature adds no database tables or tickets.

Implementation plan: [contact-help.md](plans/contact-help.md). Review evidence: [contact screenshots and verification](reviews/contact-help/README.md).

## Activate website sending

Set these in the website's environment settings (and `.env.local` for local work). Do not commit values or paste secrets into issues.

| Variable | Value and owner action |
| --- | --- |
| `RESEND_API_KEY` | A working server-side sending key. Coordinate shared Resend availability with Adhi. |
| `CONTACT_FROM_EMAIL` | A bare address on the site's Resend-verified sending domain, such as the existing sender if its domain is verified. Do not assume that the recipient's `saseconnect.org` domain is available for sending. |
| `CONTACT_TURNSTILE_SITE_KEY` | Public site key for a Cloudflare Turnstile widget. The server passes only this value to the contact form. |
| `CONTACT_TURNSTILE_SECRET_KEY` | Matching server-side Turnstile secret. |
| `CONTACT_ALLOWED_ORIGINS` | Comma-separated exact origins with scheme and optional port, without trailing slashes or paths. Explicitly include the production and any preview origins used to submit the form. |

The contact handler reads configuration from `process.env`; it does not retrieve credentials from the database. An existing sending key must be available in the deployment's runtime environment for this endpoint to use it.

Example origin format: `https://your-site.example,http://127.0.0.1:3001,http://localhost:3001`. Replace the example host with the real deployed hostname. HTTP is accepted only for loopback development origins. Wildcards are not accepted.

In the Turnstile dashboard, allow each website hostname used above. The widget uses the `contact` action. The server verifies both this action and the hostname reported by Cloudflare. Add a preview domain explicitly rather than allowing every `vercel.app` deployment. Cloudflare dummy keys cannot enable this feature in production.

Restart the local server after changing environment values, or redeploy the relevant deployment environment. If any required setting is missing or malformed, `/contact` shows a direct-email fallback and the API returns 503. The form never reports success just because it skipped sending.

No payment, membership, authentication, broadcast, or RSVP configuration changes are required by this feature. The existing `/api/email` route is unchanged. The contact adapter uses the Resend HTTP API directly so its 12-second timeout is confined to this feature.

## Deployment acceptance

1. Open `/contact` signed out on the deployed hostname. Confirm the send button and real verification widget appear.
2. Submit a clearly labeled **SASE contact test** using an email address you control. Include only test text. Confirm a reference appears.
3. Verify actual receipt at `ucf@saseconnect.org`, including spam/junk if necessary. A provider acceptance response alone does not prove inbox delivery.
4. In that received email, use Reply and confirm the destination is the address entered in the form. Only send the test reply if the inbox owner agrees.
5. Check a website-problem request includes its page and reproduction steps. Check the footer link and layout on a phone.
6. Confirm a failed verification cannot send and that blocking the verification script still leaves the direct-email option available.

The local implementation was verified with mocked providers. **Live Turnstile integration, sender/domain configuration, inbox receipt, and Reply-To behavior in the officer's mail client still need this deployment check.**

## How the request is handled

- Browser and server share field limits: name 100, email 254, subject 140, message 4,000, affected path 250, reproduction steps 2,000 characters. Server body limit is 32 KiB, enforced on streamed bytes as well as Content-Length.
- Page paths omit query strings and fragments. No session, password, user-agent, IP address, or browser-history data is appended to the email automatically.
- Visitor data is sent as plain text. The handler does not accept client-controlled recipients, senders, HTML, CC, or BCC. Reply addresses and header fields reject control characters.
- Turnstile verification has an eight-second timeout. A missing, expired, wrong-action, or wrong-host verification cannot reach the email provider. A hidden honeypot rejects simple automated fills.
- Sending disables the form controls. Each logical submission has a UUID reference. Unchanged retries reuse the same email body and Resend idempotency key; editing the message produces a new request. The browser retains retry identity for up to 23 hours within the mounted page, inside Resend's 24-hour deduplication window.
- Messages remain in React state after errors. They are not saved in browser storage or the database; navigating away or reloading loses the draft and its retry identity. An email draft link carries the entered text to the visitor's mail app, where the visitor must press Send. Very long mailto links can exceed some mail apps' limits; the plain inbox link remains available.
- No acknowledgement is sent to the visitor, so the endpoint cannot be used to send arbitrary third parties unwanted email.
- Turnstile is bot protection, not a hard per-person/hour quota. There is no in-memory limiter presented as durable protection. For a hard distributed limit, configure a deployment firewall rule or a shared limiter as a follow-up. Provider 429 responses return a 60-second retry delay, which the UI observes.

## Failure diagnosis

| Symptom | Check |
| --- | --- |
| Direct-email fallback / API 503 `not_configured` | All five configuration variables, origin format, bare sender address, real production widget keys, and deployment restart. |
| API 403 | Exact browser origin is allowlisted, with the correct protocol and port. |
| Verification fails | Widget hostname allowlist, matching site/secret keys, action `contact`, token expiry, and whether a browser extension blocked the script. |
| API 502 after verification | Resend sender/domain verification, key scope, provider status and email activity. The visitor can retry the unchanged message or use direct email. |
| API 429 | Provider throttling. Wait for the retry delay. Review provider usage before changing limits. |
| API 409 | An identical request may still be processing, or the same reference was used with changed content. Retry the original request; edits should create a new request. |
| Success shown but no inbox message | Check Resend's delivery activity and the officer inbox's spam/filter rules. Success confirms provider acceptance, not receipt. |

The API returns stable public messages and does not log message bodies, tokens, email addresses, secrets, or raw provider failures. Use the request reference to locate the matching email body; use the provider dashboard for delivery diagnosis.

## Rollback

Removing contact email/verification configuration switches `/contact` to direct email without removing help content. Reverting the feature commit removes the page, endpoint, and footer link together. Neither operation changes the other email workflows.

## Provider references

- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Turnstile widget rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
