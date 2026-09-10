# Contact & Help implementation plan

Date: 8 September 2026. Scope approved by Stevin: contact and website troubleshooting only. Officer inbox: **ucf@saseconnect.org**.

## Outcome and boundaries

A signed-out visitor can find help, describe a question or website problem, and send it to the chapter officer inbox. Officers can use Reply to answer the visitor. A failed submission retains the visitor's work and offers direct email.

This feature owns `/contact`, `/api/contact`, its validation/email adapter, tests, documentation, and one footer link. It does not change password recovery, account linking, signup, membership behavior, broadcasts/RSVP emails, the Discord bot, dark mode, or databases. Adhi's shared Resend repair remains separate. There is no ticket database, attachment upload, automatic acknowledgement email, or promised response time in this first version.

## 1. Isolate and inspect

- Work on `codex/contact-help`, starting at `29ac838` on the current landing-page branch. PR #53 is still open, so preserve this dependency when comparing or opening a later PR.
- Reuse the installed Resend integration and the repository's `{ok, data/error}` HTTP response convention, but give contact its own handler. The existing RSVP endpoint must remain unchanged.
- Follow `DESIGN.md`: light task surface, Inter, navy ink, readable blue links, 44px controls, visible field labels and focus. Scope CSS to the new page.
- Local inspection found no Resend or Turnstile configuration. Implementation and mocked verification can finish independently; activation needs deployment configuration and an inbox delivery check.

## 2. Public page and help content

- Add a server-rendered `/contact` page with metadata and the confirmed inbox visible as a mail link.
- Provide concise expandable help for QR/camera check-in, pending membership status, and reporting website/sign-in problems. Ground answers in existing behavior; do not promise unimplemented password reset or tell members to pay twice.
- Place a focused form beside help on wide screens and stack it on mobile. Required fields: name, reply email, topic, subject, message. Optional website details: affected page path and reproduction steps.
- Topics distinguish general questions, events, membership, and website issues. All go to the same approved inbox.
- Do not automatically collect browser history, session information, account credentials, query strings, or device fingerprints. Ask the visitor to describe their browser/device in their message if relevant. Tell them not to include passwords or payment details.

## 3. Form behavior

- Use a small client component for field errors, sending status, bot verification, retries, and success. Keep the rest of the page server-rendered.
- Validate in both browser and server. Associate field errors with controls, announce status, and focus the first invalid field or result.
- Disable repeated submits while a request is running. Preserve values on errors and timeouts. Keep the same submission identifier for an unchanged retry; use a fresh identifier after edits or a new message.
- Success means the email provider accepted the message, not proof of inbox delivery or officer review. Display a reference and the address officers will reply to.
- Always offer direct email. When sending is unconfigured or blocked, explain that the website has not sent the message. An optional email draft action can carry the entered text into the visitor's mail app; the visitor still sends it there.

## 4. Dedicated server boundary

- `POST /api/contact` accepts JSON only, rejects cross-origin browser submissions, and caps the actual streamed body size at 32 KiB, including requests without Content-Length.
- Validate field types, lengths, allowed topics, a UUID submission ID, email/header safety, and a nonempty bot token. Accept only relative page paths without query strings/fragments so visitors do not inadvertently send reset tokens.
- Build an explicit plain-text email. Fixed recipient: `ucf@saseconnect.org`. From: server-configured verified sender. Reply-To: validated visitor email. Subject: chapter/topic prefix plus visitor subject. Include a stable reference in the body.
- Use Resend's idempotency key for unchanged retries (24-hour provider window). Do not include request-time timestamps or bot tokens in the email payload, so a retry has identical contents.
- Return structured errors for invalid input, verification problems, missing configuration, provider throttling, and delivery failure. Never echo raw provider errors, secrets, or personal message contents into logs or HTTP errors.
- Bound outbound requests with timeouts. Do not automatically send a second email after an uncertain provider response.

## 5. Abuse protection

- Use Cloudflare Turnstile with server-side verification, expected hostname/action checks, token expiry handling, and a fresh challenge after each attempted send. No production verification bypass.
- Add a hidden honeypot, strict payload limits, fixed recipient, and no visitor auto-replies. Turnstile is the cross-instance bot gate; do not claim an in-memory counter is a durable rate limiter.
- Surface provider 429s with a retry delay. If traffic later requires a hard per-IP/hour cap, add a deployment firewall rule or shared rate-limit store as a separately configured control.
- Fail closed if email or verification configuration is absent; the public inbox and troubleshooting remain usable.

## 6. Configuration and ownership

Document `.env.example` entries for `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (bare verified address), `CONTACT_TURNSTILE_SITE_KEY` (public widget key passed by the server), `CONTACT_TURNSTILE_SECRET_KEY`, and `CONTACT_ALLOWED_ORIGINS` (comma-separated exact website origins).

Deployment owner supplies real keys in local/deployment environment settings, never in Git or chat. Turnstile widget must allow the deployed hostnames. The site key is public; the other provider keys remain server-only. Sender verification and shared Resend availability are the dependency to coordinate with Adhi, without altering his workflows.

## 7. Verification and handoff

- Automated tests: valid contact/website submissions; fixed recipient and Reply-To; rejected malformed, oversized, cross-origin, honeypot and header-injection requests; failed/expired/wrong-host challenges; missing configuration; delivery failures/throttling; stable retries and changed payload behavior.
- Run existing tests, targeted ESLint, typecheck, and production build. Distinguish existing unrelated failures from introduced regressions.
- Browser checks: signed-out entry from footer, desktop/mobile layout, keyboard operation, expandable help, required fields, successful test response, failed response with values retained, and direct-email fallback. Save labeled screenshots and state whether delivery was mocked.
- Production acceptance requires a clearly labeled test sent through the deployed form, verification of receipt at `ucf@saseconnect.org`, and confirmation that Reply targets the submitted address. Do not mark this complete from a mocked send or HTTP 200 alone.
- Record exact files, test results, configuration gaps, and rollout steps in a contact-specific handoff. Keep the feature on its own branch for review; do not merge or deploy automatically.

## References

- [Resend sending API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Turnstile rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
