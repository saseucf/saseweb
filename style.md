# UCF SASE Web Style Guide

This document is the implementation guide for the UCF SASE website. It is grounded in the currently selected Figma design and reconciled with the tokens and patterns already used in the production codebase.

## Design reference

- Figma file: `SASE_WEB_DESIGN`
- Page: `Anya mockups`
- Selected node: `Frame 5` (`465:155`)
- Reference size: `1728 x 17041`
- Primary motifs: layered waves, a sunset disc, soft circular category tiles, oversized event cards, and strong uppercase labels
- Representative nodes reviewed:
  - Event card: `602:1011`
  - Workshop category tile: `627:2611`
  - Upcoming-events button: `813:704`

The selected frame does not currently expose Figma variables. Exact production values in this guide therefore come from `app/globals.css` and the loaded fonts in `app/layout.tsx`. Visual directions that are not tokenized in Figma must be mapped to these production tokens rather than implemented with guessed colors.

## Brand character

The interface should feel:

- Bold and optimistic, not corporate or sterile
- Technical and future-facing, without looking like a generic SaaS dashboard
- Playful through illustration and large geometry, while keeping forms and account workflows calm
- Community-centered, with people and events carrying more visual weight than administrative controls

Use strong silhouettes, generous negative space, and a limited palette. The waves, sun, circular category tiles, and SASE artwork are brand devices; do not replace them with unrelated gradients or stock illustrations.

## Color system

Use semantic tokens instead of scattering raw hex values through components.

| Role | Token or value | Usage |
| --- | --- | --- |
| Primary ink | `--sase-navy: #141b4d` | Headings, primary text, dark sections, dark buttons |
| Brand blue | `--sase-blue: #89abe3` | Primary actions, active navigation, highlights, focus states |
| Warm light | `--sase-cream: #e9e8e8` | Text on dark surfaces and warm neutral sections |
| Sand accent | `--sase-yellow: #dbc8b6` | Restrained decorative accents and warm hover details |
| Light canvas | `--background: #f6f8fc` | Default light-mode page background |
| Dark canvas | `--background: #141b4d` in `.dark` | Default dark-mode page background |
| Gold accent | `#fbbf24` | Sunset/cloud highlights and rare celebratory details |
| Destructive | Existing `--destructive` token | Errors, destructive actions, and logout only |

The Figma event page also shows slate-blue surfaces, aqua event cards, coral category bubbles, and a dark-green card action. Until those values are published as Figma variables, treat them as illustration-specific colors. Do not create global colors by sampling or eyeballing the screenshot.

### Color rules

- Navy and cream establish the base contrast.
- Brand blue is the default interactive accent.
- Use gold, coral, aqua, and green sparingly; they should not compete with the main action.
- Red is never a normal membership or payment-state color. Reserve it for errors and destructive actions.
- Do not introduce additional blue gradients when a flat navy or brand-blue surface will work.
- On dark surfaces, use cream for primary text and brand blue for secondary emphasis.
- On light surfaces, use navy for primary text and muted blue-gray for supporting copy.

## Typography

### Font families

- Interface and display: `Orbitron`, exposed as `--font-orbitron` and `--font-sans`
- Technical metadata: `Roboto Mono`, exposed as `--font-mono`
- SASE wordmark: use the supplied logo asset; never recreate or typeset the logo

### Type behavior

- Navigation, buttons, eyebrows, filters, and section labels use uppercase text with generous letter spacing.
- Page titles use tight tracking and compact line height.
- Body copy uses normal casing, comfortable line height, and shorter line lengths.
- Avoid using all caps for paragraphs, validation messages, or long instructions.

| Style | Recommended implementation |
| --- | --- |
| Hero/display | `clamp(2.5rem, 6vw, 4.8rem)`, weight `800-900`, line-height `0.95`, tracking `-0.04em` |
| Section heading | `1.7rem-3rem`, weight `800-900`, tight tracking |
| Card title | `1.1rem-1.4rem`, weight `700-800` |
| Body | `0.9rem-1rem`, line-height `1.55-1.7` |
| Navigation | `0.7rem-0.75rem`, weight `700`, tracking `0.12em-0.16em`, uppercase |
| Button | `0.7rem-0.8rem`, weight `800`, tracking `0.08em-0.12em`, uppercase |
| Metadata | `0.72rem-0.8rem`, `Roboto Mono` |

## Layout and spacing

- Use a 4 px spacing base.
- Prefer the sequence `4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 96`.
- General page content has a maximum width of `1180px`.
- Global navigation has a maximum width of `1280px` where it is not full-bleed.
- Desktop horizontal padding is approximately `5vw` or `48px`.
- Mobile horizontal padding is `20px-24px`.
- Keep body-copy lines near `55-70` characters.
- Use large vertical gaps between editorial/event sections; avoid stacking every section inside a card.

The selected Figma frame uses full-width decorative layers with content aligned above them. Decorative waves and bubbles may extend beyond the viewport, but interactive content must stay inside the content grid.

## Shape language

The design combines two shape families:

1. Functional surfaces use restrained corners: approximately `4px-10px`.
2. Brand and category elements use circles, pills, and large organic curves.

Do not apply large rounded corners to every container. Reserve circles and exaggerated rounding for category navigation, artwork, avatars, and selected calls to action.

## Components

### Navigation

- Keep the navigation fixed and visually quiet.
- Use the horizontal SASE logo asset at the left.
- Desktop links are uppercase, bold, and widely tracked.
- The current route uses brand blue.
- Mobile uses a dedicated menu and keeps the most important member action visible.
- Authentication state must not shift the logo or primary navigation unexpectedly.

### Buttons

Primary button:

- Brand-blue background
- Navy or high-contrast text
- Uppercase, bold, widely tracked label
- Minimum target height of `44px`
- Visible hover and focus states

Secondary button:

- Transparent or light surface
- Subtle blue-gray border
- Navy text
- May invert to navy on hover

Pill button:

- Use only for compact navigation, filters, login, or a high-priority contextual action
- Do not use pill styling for every form action

### Cards

- Event cards are image-led and may use the aqua illustrated treatment shown in Figma.
- Functional cards use a white/light surface, `1px` border, and a restrained shadow.
- Default functional card radius is approximately `5px`; larger radii are reserved for editorial/promotional cards.
- Keep one clear title, one supporting block, and one primary action per card.
- Do not add shadows to nested elements inside an already elevated card.

### Category tiles

The selected design uses large circular red/coral bubbles for event categories such as GBMs, socials, galas, conferences, and workshops.

- Use the exported Figma artwork when implementing these tiles.
- Keep labels uppercase and centered beneath or within the visual.
- Preserve consistent circle size and spacing.
- Do not redraw the category icons or replace them with loosely related icons.

### Forms

- Use a focused single-column form for membership and payment flows.
- Keep the form container at or below `680px`.
- Labels stay visible above inputs; placeholders are examples, not labels.
- Inputs use a light surface, `1px` border, and a clear brand-blue focus ring.
- Group phone, email, and identity fields under a short “Member information” heading.
- Show validation next to the affected field and include a plain-language recovery step.
- The final payment action must be visually dominant and state the consequence, for example `Pay membership dues`.
- Never use color alone to indicate paid, pending, failed, or unmatched status.

### Payment and membership status

Use explicit status language:

- `Payment confirmed`
- `Payment processing`
- `Payment needs review`
- `No payment found`

Successful payment states may use a restrained green accent. Pending states use brand blue or gold. Errors use the destructive token. Always pair the color with an icon and text.

Do not show internal matching logic, raw webhook payloads, session identifiers, or database IDs to members.

## Imagery and icons

- Prefer the actual SASE logo, event artwork, and exported Figma assets.
- Preserve the selected design's illustrated, slightly retro-futurist character.
- Use Lucide icons for ordinary interface actions only when an equivalent project icon already exists.
- Do not redraw Figma artwork as approximate inline SVG paths.
- Size icons explicitly with equal width and height.
- Every meaningful image needs useful alternative text; decorative wave and bubble artwork should be hidden from assistive technology.

## Motion

- Standard interaction transitions: `150-250ms`.
- Use simple color, opacity, and small translate transitions.
- Section entrance animation may use the existing AOS fade treatment.
- Avoid continuous movement in payment, authentication, and form workflows.
- Respect `prefers-reduced-motion` and ensure content remains available with animation disabled.

## Responsive behavior

The Figma reference is a desktop canvas; mobile must be intentionally recomposed rather than proportionally shrunk.

- Switch navigation at the existing `md` breakpoint.
- Stack event cards and form sections into one column.
- Reduce decorative artwork scale and allow intentional cropping.
- Keep headings readable without forcing single-line text.
- Maintain at least `20px` page gutters.
- Maintain `44px` minimum interactive targets.
- Never allow payment fields or status messages to overflow horizontally.

## Accessibility baseline

- Meet WCAG AA contrast for text and controls.
- Provide keyboard-visible focus styles using brand blue with sufficient contrast.
- Maintain semantic heading order.
- Use real `button`, `a`, `label`, `input`, and status elements.
- Announce asynchronous payment updates with an appropriate live region.
- Error messages must explain how to fix the problem.
- Avoid disabling zoom in new layouts.

## Implementation rules

- Reuse the tokens in `app/globals.css` before introducing new values.
- Prefer Tailwind utilities for local layout and existing `.sase-*` classes for repeated brand patterns.
- Promote a value to a token only after it repeats across at least two components or is formally defined in Figma.
- Use theme-aware semantic colors instead of assuming dark mode.
- Download and commit durable copies of Figma-exported assets; temporary MCP asset URLs expire.
- Do not paste generated Figma code directly. Adapt it to the project's Next.js, React, TypeScript, and Tailwind conventions.

## Review checklist

Before merging a new page or component, confirm:

- It uses the established navy, brand blue, and cream hierarchy.
- Typography follows the Orbitron/Roboto Mono roles.
- The primary action is unmistakable.
- Mobile layout is deliberately composed and tested.
- Focus, hover, loading, success, error, and empty states exist where relevant.
- Text and controls meet contrast and target-size requirements.
- Existing components and tokens were reused.
- Figma illustrations and logos use the real exported assets.
- No raw payment, webhook, or identity-matching data is exposed to the user.

