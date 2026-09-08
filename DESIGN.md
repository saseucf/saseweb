# UCF SASE design standard

Version 1.0, 8 September 2026. A working standard for the next frontend cleanup, based on the Figma work available today. This defines the target styling; it does not mean the current application implements every rule.

Read [PRODUCT.md](PRODUCT.md) for audience and product principles. This is the canonical styling reference and supersedes the earlier assumptions in `style.md`.

## 1. Evidence and decisions

- **Figma:** measured from a named node, or directly visible in the referenced artwork.
- **Adopted:** established in the implementation or explicitly settled during the hero work.
- **Proposed:** a recommended default for an unfinished design. Use it consistently during future cleanup, while keeping it revisable as Anya designs more screens.

| Source | What it establishes |
| --- | --- |
| [Homepage, Frame 3, `456:110`](https://www.figma.com/design/IAsev5n73AI0dH5eoH9bZT/SASE_WEB_DESIGN?node-id=456-110) | Navy and cream identity, blue accents, sun/cloud artwork, rolling waves, heading/body/subtitle font roles. |
| [Events, Frame 5, `465:155`](https://www.figma.com/design/IAsev5n73AI0dH5eoH9bZT/SASE_WEB_DESIGN?node-id=465-155) | Slate sections, aqua section labels, large category artwork, image-led event presentation. |
| [Event artwork, `602:1011`](https://www.figma.com/design/IAsev5n73AI0dH5eoH9bZT/SASE_WEB_DESIGN?node-id=602-1011) and [workshop category, `627:2611`](https://www.figma.com/design/IAsev5n73AI0dH5eoH9bZT/SASE_WEB_DESIGN?node-id=627-2611) | Illustrated event identity and circular motifs. Poster typography and its green FLIP button are artwork-specific, not global UI tokens. |
| [Hero implementation, PR #52](https://github.com/saseucf/saseweb/pull/52) | Stable mobile composition, organization subtitle, shallower three-layer waves with independent motion. |
| `app/layout.tsx`, `app/globals.css`, `components/GlobalNav.tsx` at `1203bbe` | Current light theme, fonts, semantic colors, navigation breakpoints, and implementation gaps. |

The inspected Figma file has no local variable collections, paint styles, or text styles. Values were read from node properties, not sampled from screenshots. [figma-source.json](docs/design/figma-source.json) preserves the inspection. The desktop frames are compositions, not finished responsive or interactive specifications.

Companion files:

- [Visual specimen](docs/design/index.html): light/dark comparison, type, colors, and proposed component states.
- [Reference tokens](docs/design/tokens.css): OKLCH colors, semantic themes, spacing, dimensions, and motion. Not imported by the app.
- [Token data and contrast calculations](docs/design/tokens.json): source hex values, provenance, and computed contrast pairs.

Priority when references differ: explicit product decisions, this standard's source/adoption labels, the relevant Figma frame, then existing implementation. Accessibility and content fit must survive translation. A proposed default must never be described as an approved Figma component.

## 2. Visual identity and surface roles

The reference is Anya's SASE sun, cloud, and wave composition. The voice is **buoyant, mechanical, communal**: broad solid lettering, recognizable engineering artwork, warm light against navy, and shared activity.

### Public pages

Home, About, Events, Programs, and Team communicate chapter identity. Use a **committed** navy/blue color strategy for dedicated brand sections, with cream, gold, and event artwork serving named roles. Community photos and real event art carry the content. Vary section rhythm instead of presenting every idea in an identical card.

### Member and officer pages

Login, signup, membership, profile, check-in, forms, and admin screens use a **restrained** strategy. Share typography, blue actions, navigation language, and shape scale, while using predictable forms, lists, and tables. Continuous waves, glowing category bubbles, and promotional headings belong outside task workflows.

### Theme decision

A student checks an event location or scans into a meeting on a phone while walking through bright campus light; a clear light canvas with dark text remains the operational default. A visitor browsing chapter culture in the evening can encounter the navy brand composition established in Figma, with warm light type and readable blue accents.

**Adopted:** keep the existing light default during frontend cleanup. `ThemeProvider` currently uses `forcedTheme="light"`; dark CSS is not a working theme selector. **Figma:** navy is the canonical illustrated brand scene. **Proposed:** support both semantic palettes in future components, then decide theme-switch behavior separately. Do not activate global dark mode as a side effect of this standard.

## 3. Color foundations

Preserve the measured sRGB swatches. Their converted OKLCH equivalents live in the reference tokens; conversion is not a palette redesign.

| Primitive | Source hex | Role | Evidence |
| --- | --- | --- | --- |
| Navy | `#141b4d` | Primary ink; dark brand canvas; strong secondary action | Figma frame fills |
| Brand blue | `#89abe3` | Primary button fill; selected accents; links on dark | Figma logo accents and subtitle |
| Cream | `#fffde5` | Warm light text and details on navy | Figma wordmark and logo fills |
| Slate | `#394774` | Supporting sections; alternate dark surface | Figma `456:142`, `465:187` |
| Deep surface | `#292d53` | Quiet dark panel tone | Figma `456:139`; panel usage proposed |
| Aqua | `#b4e4ed` | Event section emphasis | Figma event heading fills; not every poster's background |
| Gold | `#ffcf5e` | Cloud highlights and occasional celebratory details | Figma `456:120`, `456:149` |
| Light canvas | `#f6f8fc` | Default light page background | Adopted, current code |
| Strong link blue | `#4266a4` | Readable links and focus on light | Adopted, current navigation |

Sunset reds remain illustration colors, not normal action or payment-state colors. Coral category circles and the event poster's aqua/green treatment remain asset-specific until their roles are designed. Do not sample a flattened poster to invent application tokens.

The older `--sase-cream: #e9e8e8` is gray, not Figma's cream. `--sase-yellow: #dbc8b6` is sand and must not stand in for cloud gold. Preserve source artwork and reconcile ordinary CSS colors deliberately during cleanup.

### Semantic component colors

These are **proposed mappings** built from the measured palette and readable supporting colors. Components consume roles, not hardcoded swatches.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#f6f8fc` | `#141b4d` |
| Surface | `#fbfcff` | `#292d53` |
| Alternate surface | `#eef2f9` | `#394774` |
| Primary text | `#141b4d` | `#fffde5` |
| Secondary text | `#52617c` | `#b3bdd6` |
| Primary action / its text | `#89abe3` / `#141b4d` | Same pair |
| Link and focus | `#4266a4` | `#89abe3` |
| Control boundary | `#7b88a4` | `#899abb` |
| Success text | `#25634f` | `#a2d5bd` |
| Warning text | `#755014` | `#ffcf5e` |
| Error text | `#9d293a` | `#ffb4b7` |

Statuses include explicit text and, where helpful, an icon. Neutral information is not an error. Selected, paid, pending, and invalid states must not rely on color alone.

### Checked combinations

Ratios use full-opacity sRGB source values. Display values are rounded; use the unrounded values in `tokens.json` for threshold decisions.

| Pair | Contrast | Use |
| --- | --- | --- |
| Cream on navy | 15.79:1 | Brand text |
| Navy on brand blue | 6.96:1 | Primary button label |
| Navy on light canvas | 15.27:1 | Normal text |
| Secondary light text on light canvas | 5.88:1 | Supporting copy |
| Strong link blue on light canvas | 5.38:1 | Links |
| Secondary dark text on slate | 4.80:1 | Supporting dark text |
| Light control boundary on light canvas | 3.35:1 | Input outline |
| Dark control boundary on slate | 3.18:1 | Input outline |
| Brand blue on light canvas | 2.20:1 | Fails ordinary text contrast; use the strong link role |

Avoid opacity-based muted text and faint focus rings. Use explicit semantic pairs. Brand-blue buttons may need a navy keyline where identifying the control depends on its boundary.

## 4. Typography

**Figma roles, normalized for the web:**

| Role | Family and weight | Evidence / application |
| --- | --- | --- |
| Interface and general headings | Inter, 400/600/700/800 | Figma navigation and homepage heading. Controls, labels, forms, tables, and headings. |
| Public body copy | Outfit, 400/500 | Homepage paragraph `456:143`. Comfortable sentence-case prose. |
| Logo subtitle / signature | Space Mono, 700 | `456:128`, `465:173`. Reserve for this short brand signature. |
| Event category display | Archivo, 700 | Category labels such as `583:971`. Load only where needed. |
| SASE wordmark | Supplied logo asset | Figma contains Archivo Black lettering; never typeset or reconstruct the production logo. |

The app currently loads Orbitron and Roboto Mono. They are implementation choices, not the inspected Figma font system. Future cleanup should replace global Orbitron UI/body usage with these roles. Keep the logo asset. Start with Inter for the application, then scope Outfit, Space Mono, and Archivo to their roles instead of loading every family on every page.

### Proposed web scale

The 1728px Figma canvas includes oversized labels and some line heights shorter than the text. Copy the hierarchy, not those raw metrics.

| Style | Mobile | Desktop | Weight / line height |
| --- | --- | --- | --- |
| Brand page title | 40px | Up to 64px using `clamp()` | Inter 800 / 1.08–1.15 |
| Section heading | 32px | 40px | Inter 800 / 1.2 |
| Subsection heading | 25px | 25px | Inter 700 / 1.3 |
| Card or group heading | 20px | 20px | Inter 700 / 1.3 |
| Public paragraph | 16px | 18px | Outfit 400 / 1.6–1.7 |
| Product page title | 32px | 32px | Inter 700 / 1.2 |
| Input and product body | 16px | 16px | Inter 400 / 1.5 |
| Button and field label | 14px minimum | 14–16px | Inter 600–700 / 1.4 |
| Supporting metadata | 14px | 14px | Inter 400–500 / 1.5 |
| Signature beneath logo | 12–14px | 14px | Space Mono 700 / 1.65 |

Use rem equivalents. Keep prose near 65ch, with a 75ch upper bound. Give text on dark surfaces more breathing room. Use uppercase and 0.08–0.12em tracking for short public navigation, brand buttons, category labels, and the signature. Product actions, forms, errors, and paragraphs use sentence case and normal tracking. No gradient text, decorative serif substitutions, or monospace paragraphs.

## 5. Layout and responsive behavior

**Proposed spacing scale:** 4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 96px. Convert to rem. Keep related content close and separate distinct tasks with larger gaps.

| Relationship | Default |
| --- | --- |
| Icon to label; label to field | 8px |
| Related controls | 12–16px |
| Adjacent form groups | 24px |
| Panel padding | 24px mobile; 32px desktop where useful |
| Public section gap | 64px mobile; 80–96px desktop |
| Operational section gap | 32–48px |

Use 20–24px mobile gutters and 32–48px desktop gutters. Standard content max: 1180px; wide navigation/hero max: 1280px; form max: 680px. Full-bleed artwork can sit outside these widths, while text and controls align to a shared grid. Do not manufacture empty space from viewport height.

Mobile recomposes the design: columns stack, labels wrap, actions wrap, and artwork shrinks within an explicit aspect ratio. Do not scale an entire desktop frame. Images preserve their proportions; crops protect faces and essential poster text. Event details also appear as selectable text.

Start with existing breakpoints: 640px for small enhancements, 768px for layouts that actually fit, and 1024px for desktop navigation and the hero split. The older guide's `md` navigation recommendation is stale; `GlobalNav` uses `lg`. Verify both 1023px and 1024px.

Dense tables may use a labeled local horizontal scroll region; the page must not scroll sideways. Mobile record summaries may stack, but preserve information and actions.

## 6. Artwork, shape, and elevation

Use supplied logo variants for the background: dark ink on light, light lettering on dark. Preserve aspect ratio and clear space. A provisional clear-space rule is one quarter of the rendered logo height on all sides. Do not recolor raster wordmarks with filters or recreate them as text.

Use actual SASE photos, event artwork, sun, cloud, and wave assets. Meaningful images get useful alt text; decorative motifs use empty alt text or `aria-hidden`. Use the existing Lucide set for ordinary UI icons, usually 20px with consistent stroke weight. Icon-only buttons still need a 44px target and accessible name.

**Proposed shape scale:** 4px for small inset details, 6px for controls, 10px for functional panels, and up to 16px for image-led features. Circles belong to avatars, category artwork, and sun motifs; pills belong to filters, badges, and compact navigation.

Default elevation is none. Prefer a meaningful surface change or 1px border. A floating menu can use one soft navy-tinted shadow; nested content should not gain competing shadows. Avoid decorative glass panels, heavy side-stripe accents, and repeated icon-heading-body card grids.

## 7. Component contracts for unfinished screens

These are **proposed defaults**, not extracted Figma components. Preserve routes, validation, data meaning, and behavior during restyling.

### Navigation and page headers

Keep the logo position consistent, clearly identify the current route, and retain a visible member action on mobile. Use a non-color selection cue and current-page semantics. Menu triggers have an accessible name and expanded state; dismissible menus support keyboard dismissal and sensible focus return. Fixed navigation must not cover anchors or focused controls. A page header contains one title, necessary context, and its primary action when applicable.

### Buttons, links, and filters

Primary: brand blue with navy text. Secondary: navy with cream text on light; a transparent or deep surface with cream text and a visible boundary on dark. Quiet: a text link or low-emphasis button that remains visibly interactive. Destructive: the error role and explicit action wording.

Use one dominant action per local decision. Minimum target: 44 × 44px, including icon buttons. Default padding: 12px vertical and 20–24px horizontal. Preserve dimensions while loading. Use a task verb such as “Save profile” or “Check in.” Links navigate; buttons act. Filters need a visible selection cue and correct pressed/selected semantics. Underline links in paragraphs.

### Forms

Prefer a focused single column, permanent labels, 16px input text, visible boundaries, and strong focus. Place help before submission and errors beside their fields. Placeholders are examples, not labels. Preserve entered values after failure, associate errors with fields, and move focus appropriately after failed submission. Password visibility and required-field instructions work with keyboards and screen readers.

Group long forms by task; do not put a card around each field. Keep member-facing language free of internal payment matching, database IDs, and provider payloads.

### Events and categories

Lead with real event art, followed by title, date/time, location, category, and the relevant action as HTML text. Distinguish Upcoming from Past. Upcoming events prioritize attendance actions; past events prioritize recap content. The poster's FLIP affordance must not be the only path to essential details. Category artwork is navigation with a readable label and selection state, not a bubble behind every component.

### Lists, tables, and member panels

Use rows for comparisons and records. Align fields, keep labels near values, and place actions predictably. Panels group a task or meaningful record. Preserve QR quiet zones and reliable scanning during check-in restyling; essential controls stay outside moving artwork.

### States

| State | Required treatment |
| --- | --- |
| Default / hover / pressed | Clear action role; small color or opacity changes without layout jumps. |
| Keyboard focus | Solid 2px outline with 3px offset using the semantic focus color; check against the actual background. |
| Selected | Text, icon, underline, or another non-color cue plus appropriate ARIA state. |
| Loading | Preserve dimensions and context; use an action label or content-shaped skeleton. |
| Disabled | Prevent activation, retain a legible label, explain an unclear prerequisite nearby. |
| Empty | Explain what is absent and offer the useful next action without inventing data. |
| Error | State the problem and recovery action; retain input. Color supplements text. |
| Success | Confirm completion without hiding context; announce asynchronous updates appropriately. |

## 8. Motion

**Adopted homepage exception:** retain three waves at 48% group opacity in a 76–150px bounded area. Each extended layer drifts horizontally by ±6% and vertically by ±5–10px, using staggered 9s / 7s / 5.5s alternating durations. Durations are per direction; full cycles take twice as long. Extend the layers 8–10% beyond the container on both sides so their edges remain covered throughout the motion. Keep logo, sun, clouds, subtitle, and controls stationary. Reduced motion produces static waves.

**Adopted landing-page entrances:** below the hero, content fades and rises 16px once as it enters the viewport, over 520ms with up to 180ms of stagger. Content already visible on load stays still. Content remains visible without JavaScript, and keyboard focus or enabling reduced motion cancels active entrances. Link arrows move 3px over 150ms; the sponsor logo scales to 1.025 over 220ms on hover or keyboard focus. These effects are confined to the homepage.

**Proposed ordinary interactions:** 150ms feedback and 220ms reveals, using `cubic-bezier(0.22, 1, 0.36, 1)`. Ambient waves retain ease-in-out because they reverse continuously. Animate transform and opacity, not layout properties. No bounce or elastic easing.

Forms, check-in, membership, and admin have no decorative continuous animation. Content remains visible when animation is disabled. Do not apply AOS to every new section or require it for content visibility. Future cleanup should also suppress unnecessary smooth scrolling and large entrances under reduced motion.

## 9. Accessibility and copy

Target WCAG 2.2 AA. Normal text needs 4.5:1 contrast; qualifying large text needs 3:1. Controls and meaningful boundaries need 3:1 against adjacent colors when those boundaries identify the control. See W3C's [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) explanations.

The project's 44px touch-target rule is stronger than [WCAG 2.2 AA's minimum target-size criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), which uses 24px with exceptions. Do not describe 44px as the universal AA requirement.

Use semantic headings, native controls, associated labels, visible focus, and status text. Support zoom and long content without clipping. The current `maximumScale: 1` viewport setting is a cleanup item, not part of this standard. Test 200% text zoom and 320px reflow. Never hide an essential action to make a layout fit.

Copy is direct, welcoming, and specific: “Pay membership dues,” “Payment confirmed,” or “Try again,” according to the real state. Avoid all-caps explanations, repeated introductions, unexplained acronyms, and em dashes. Empty and error copy must reflect actual behavior.

## 10. Applying this standard

Reference CSS is documentation, not a drop-in replacement. Importing it alone will not update existing Tailwind aliases or component classes.

| Current drift | Future cleanup |
| --- | --- |
| Global Orbitron / Roboto Mono | Introduce scoped Figma font roles in `app/layout.tsx`; verify reflow and navigation fit. |
| `.sase-home` owns brand variables | Promote shared primitives globally; keep scene geometry scoped to the hero. |
| Gray cream and sand yellow | Resolve to documented roles instead of blindly renaming unrelated colors. |
| Generic `--primary`, `--border`, `--ring` | Map existing aliases to semantic roles: background → canvas, foreground → text, card → surface, primary → action, primary-foreground → action text. Audit consumers before changing shared aliases. |
| Repeated inline button/input styles | Extract shared components after comparing at least two real uses; retain the Next.js/React/Tailwind structure. |
| Forced light theme | Preserve initially; selector and persistence are a separate feature decision. |
| `maximumScale: 1` | Restore user zoom when addressing the shared shell. |
| Broad AOS and smooth-scroll rules | Preserve reduced-motion preferences and immediate content visibility. |

Recommended order:

1. Fonts, semantic colors, contrast, zoom, and shared spacing.
2. Navigation, buttons, inputs, and states; verify a representative page before broad rollout.
3. Public Events and About styling using existing artwork and content rhythm.
4. Membership, account, check-in, and admin using the calmer product rules while preserving workflows.

Keep the settled hero geometry and restrained waves while resolving typography and token consistency. Make focused changes and review screenshots at each stage.

## 11. Acceptance checklist

- Choices trace to a Figma source, adopted decision, or explicitly proposed default.
- Prose, controls, metadata, and signatures use their intended font roles.
- Text, focus, and control boundaries pass contrast on their actual surfaces.
- Gutters, wrapping, aspect ratios, targets, and navigation fit work at 320, 390, 768, 1023, 1024, and 1440px.
- Long titles, empty data, loading, errors, and completed actions fit the layout.
- Keyboard use, zoom, accessible labels, and reduced motion remain usable.
- Artwork uses real assets; essential event information is readable independently.
- Each local decision has a clear primary action; layouts avoid anonymous repeated cards.
- Styling does not alter unrelated routes, business rules, backend behavior, or content.

Still open in Figma: mobile compositions, reusable component variants, complete light-theme designs, account/admin layouts, and a published variable/type-style library. These defaults make the gaps workable without claiming they are finished designs.
