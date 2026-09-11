# Login page redesign

The Login page now matches SASE's public styling with a navy chapter panel, Inter typography, and a clearly organized sign-in form. The chapter panel uses the existing `public/events/breadboard2.jpg` workshop photo, giving Login its own image instead of repeating the general body meeting portrait. Below 900px, the panel is hidden and the approved mobile form layout is retained.

## Scope

- `app/login/page.tsx` and its CSS module own the page layout and metadata.
- `components/login-form.tsx` and its CSS module own the form presentation, password visibility control, and session-check skeleton.
- Email/password, Discord, Google, Signup, validation, error announcements, loading state, autocomplete, profile confirmation, and safe redirects remain available.
- The session-check effect and both authentication handlers match the latest `origin/dev` exactly.
- Signup, check-in login, shared navigation, other pages, APIs, and database configuration are unchanged by this feature.

The branch is `feature/login-page-redesign`, rebased onto `origin/dev` at `6c64020fd282a88650a45be8a1cb5a1ebb86a64b`. The feature PR targets `dev`.

## Checks on the final implementation

- `npm run build`: passed, including Next.js lint and application type validation.
- `npx eslint app/login/page.tsx components/login-form.tsx`: passed.
- `npx tsx --test tests/auth-redirect.test.ts`: 3 tests passed.
- Source comparison: session checks, password and OAuth handlers, profile gates, and redirects are identical to the current base branch.
- The replacement workshop photo was visually inspected from the existing local asset.

## Browser checks from the approved layout

These checks were performed before the desktop-only photo replacement and rebase. No form markup or page CSS changed in the photo revision.

- Empty required fields and malformed email trigger native validation.
- Show/hide password works with mouse and keyboard and retains entered sample text.
- Signup opens the existing Signup page.
- Keyboard order follows Email, Password, Show password, Log in, Discord, Google, and Sign up, with a visible outline on every control.
- No horizontal overflow at 320, 390, 768, 900, or 1280px.
- Mobile inputs use 16px text, with form controls and links at least 44px high.
- No browser console errors in the production preview.
- Reduced-motion CSS disables control transitions and active translation; OS-level emulation was not performed.

No real account sign-ins or OAuth authorization flows were completed, and no emails were sent. This is a presentation review with redirect regression tests and source comparison, not an end-to-end authentication service test.

## Visual evidence

- `before-desktop.jpg`: original Login page before the redesign.
- `mobile.jpg`: approved 390 × 844 mobile layout, captured before the desktop-only photo replacement and rebase.
- `responsive-checks.json` and `keyboard-checks.json`: measurements from that layout review.
- [Replacement workshop photo](../../../public/events/breadboard2.jpg).

Fresh desktop screenshot capture was blocked because the host Mac was locked. The final desktop crop and the page after the rebase still need a browser review. The build is available locally at `http://127.0.0.1:3004/login` and in the PR's deployment preview when available.
