# Contact & Help review evidence

8 September 2026. Feature branch: `codex/contact-help`. Base: `29ac838` on `codex/landing-page-polish` (PR #53 is still open). This feature is limited to the new contact page/API, footer entry, and supporting tests/docs/configuration example.

## Checks

| Check | Result |
| --- | --- |
| Contact automated tests | 10 passing tests, including malformed and oversized requests, field/header validation, origin restrictions, bot checks, fixed recipient, Reply-To, provider errors, timeouts, and stable retry payload/key. |
| Targeted ESLint | Pass for all contact TS/TSX files, test file, and footer. |
| Production build | Pass in an isolated snapshot, preserving the running development server. `/contact` and `/api/contact` are dynamic routes. |
| Full suite | 37/40 pass. The three failures are in unchanged membership/Zeffy code: unpaid member results, payment eligibility, and expected missing campaign configuration. |
| Standalone typecheck | Two errors in unchanged `tests/admin-membership.test.ts:167`: `unpaidMembers` is absent and destructured `id` is implicitly `any`. No contact errors. |
| Actual local API without configuration | Returns 503 `not_configured`, never a false success. |
| Signed-out UI | Contact content/form works without a session; footer provides an entry. |
| Responsive review | 1280px desktop; 390px and 320px mobile. No horizontal overflow at the checked mobile sizes. |
| Validation and focus | Empty submit shows inline errors and focuses name. Error and success responses move focus to their result. |
| Failure and retry | Simulated provider failure retains all website report fields. Fresh verification plus unchanged retry uses the same UUID, identical email body, and fixed recipient. |
| New message | Success offers a fresh form; subsequent request receives a different reference. |
| Verification widget | Real component and Cloudflare script rendered successfully with Cloudflare's public development test key, including compact layout at 320px. Submission receives the widget token. Server verification and email delivery remained mocked. |

The isolated preview at port 3004 used a copy of the application with an injected fake provider transport. Its initial flow checks used a plainly labeled test verification button; the final widget check used the actual contact verification component and [Cloudflare's official test site key](https://developers.cloudflare.com/turnstile/troubleshooting/testing/). No testing bypass or dummy credentials were added to the production feature. The actual local page at port 3001 remains in the honest unconfigured state.

[Mocked delivery records](mocked-delivery-evidence.json) show the repeated request key and `identicalRetry: true`. All addresses used for the simulated visitor are test addresses. These records and screenshots **do not prove inbox delivery**. Activation still requires the real environment settings and inbox/Reply-To check in [the handoff](../../contact-help.md).

## Screenshots

The latest simplification removes repeated instructions, shortens notices and help copy, and places the form before troubleshooting on mobile. All fields and submission behavior are preserved. Checked the revised layout at 1280px and 390px, including conditional website fields and their accessible descriptions; targeted ESLint passes.

Current layout: [simplified desktop](simplified-desktop.jpg) and [simplified mobile](simplified-mobile.jpg).

The screenshots below preserve the initial implementation and its behavior checks, before this copy/layout simplification. Screenshots are viewport captures, not stitched full-page images. Files with `mocked` in their name show test transport states.

| Screenshot | What it shows |
| --- | --- |
| [Desktop, local fallback](desktop-unconfigured.jpg) | Public contact information, help, and clear unavailable-sending notice. |
| [Mobile help](mobile-help.jpg) | Contact information, mobile jump link, expandable troubleshooting. |
| [Mobile form, local fallback](mobile-form-unconfigured.jpg) | Labels, readable controls, and direct-email fallback at 390px. |
| [Desktop validation, mocked preview](desktop-validation-mocked.jpg) | Inline required-field messages and keyboard-visible focus. |
| [Desktop send failure, mocked](desktop-send-failure-mocked.jpg) | Retained reproduction steps, retry action, and direct email recovery. |
| [Desktop success, mocked](desktop-success-mocked.jpg) | Reply address and reference after a successful unchanged retry. |
| [Mobile website form, mocked preview](mobile-website-form-mocked.jpg) | Topic-specific form and readable entered text. |
| [Mobile success, mocked](mobile-success-mocked.jpg) | Wrapped reference, new-message action, and footer link. |
| [Compact verification, public test key](mobile-verification-test-key.jpg) | Real widget at 320px with Cloudflare's visible testing label. |
