# Programs page redesign

Review route: `/programs`

The page now introduces both programs with chapter photography and direct section links. Intern information follows the semester timeline; Mentor–Mentee information groups matching, meetings, and community events. Existing time commitments and application availability are preserved.

## Screenshots

| View | Screenshot |
| --- | --- |
| Desktop introduction | [desktop-hero.jpg](desktop-hero.jpg) |
| Intern Program | [desktop-intern.jpg](desktop-intern.jpg) |
| Mentor–Mentee | [desktop-mentorship.jpg](desktop-mentorship.jpg) |
| Application status and next step | [desktop-closing.jpg](desktop-closing.jpg) |
| Tablet introduction | [tablet-hero.jpg](tablet-hero.jpg) |
| Mobile introduction | [mobile-hero.jpg](mobile-hero.jpg) |
| Mobile mentorship | [mobile-mentorship.jpg](mobile-mentorship.jpg) |

These are viewport screenshots captured during local validation. The desktop section screenshots include the development indicator; the final introduction and mobile mentorship screenshots use the production preview.

## Validation

- `npm run build`: passed for the final implementation.
- `npx eslint app/programs/page.tsx`: passed.
- `git diff --check`: passed.
- Inspected all sections on desktop and mobile. Checked 320px, 390px, 768px, and 1280px widths for horizontal overflow and link targets smaller than 44px; none found. Both photos loaded. Measurements: [responsive-checks.json](responsive-checks.json).
- Tested program anchor links, Enter activation, focus transfer to the destination section, and clearance below the fixed navigation.
- Verified Events and Team links navigate to their existing routes.
- Reviewed reduced-motion CSS: entrance and hover animations are opt-in to `no-preference`; smooth scrolling is disabled for reduced motion on Programs. OS-level motion emulation was not performed.
- `npm run typecheck` reports existing errors in `tests/admin-membership.test.ts:167`: missing `unpaidMembers` (TS2339) and implicit-any `id` (TS7031). That file is unchanged.

## Scope

The implementation changes only `app/programs/page.tsx` and its CSS module, alongside this review evidence. There are no database, API, environment, shared-navigation, or other-page changes. Applications remain coming soon. The branch starts from `dev`; promotion to `main` is a separate release step.
