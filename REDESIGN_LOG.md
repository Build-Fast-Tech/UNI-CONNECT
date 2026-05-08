# UniConnect — Redesign Log

A running journal of the editorial-grade frontend rebuild. One paragraph per phase.

---

## Phase 1 — Foundations (complete)

Cut the four-theme system (linen, midnight, daylight, monochrome) down to two — Light and Dark — and rebuilt the token layer from scratch. The new palette is paper-cream + editorial ink for Light, warm charcoal + lifted moss for Dark, with a single deep-moss primary, honey-saffron accent, and a six-stop hue palette (`--hue-a..f`) for places that legitimately need multi-color tags (university chips, avatars, syntax highlight). Swapped the display serif from Playfair to Instrument Serif (Google Fonts) for a sharper, more contemporary editorial voice; Geist Sans + Geist Mono remain. Rewrote `globals.css` from scratch: token blocks for two themes, motion tokens (`--ease-out-soft`, `--dur-base`, etc.), refined scrollbar/selection/focus styles, and a full animation library (marquee, aurora drift, tilt-glow, scroll progress, page fade-up, stagger reveal, link-grow, word-rise, skeleton shimmer, AI caret, ripple, confetti). Migrated every hardcoded hex inside the `coding-*` and `pk-*` (syntax highlight) classes into token references — the entire stylesheet now lives off CSS variables, so future palette tweaks happen in one place. `ThemeProvider` now does legacy migration (old `linen`/`midnight` reads remap to `light`/`dark`), respects OS preference on first visit, and exposes a `toggle()` helper. Added an inline FOUC-prevention script to `app/layout.tsx` so the chosen theme is applied before paint, removing the visibility-hidden flash.

---

## Phase 2 — Primitives (complete)

Rebuilt `Button` from the ground up: seven variants (`primary`, `accent`, `secondary`, `outline`, `ghost`, `link`, `destructive`) × five sizes × two shapes (`square`, `pill`). The hover state now uses layered shadow + 1px lift instead of the old "brightness 110" trick (which always looks cheap on light themes); active-press is `scale(0.98) translateY(1px)`; ripple is preserved. Added four new primitives the rest of the redesign builds on: `Surface` (token-driven card with `tone`, `elevation`, `radius`, and `interactive` variants), `Pill` (badge with the full hue-palette tone set baked in, used everywhere multi-color tags appear), `Field` (input wrapper with label/hint/error/prefix/suffix and a focus ring that draws a 4px primary halo), and `Kbd` (keyboard chip for the upcoming command palette). All five components live entirely on tokens — there is no raw color anywhere in `components/ui/`.

---

## Phase 3 — Marketing chrome (complete)

Replaced the four-theme dropdown switcher with a true two-state `ThemeSwitcher` — a 36px circular toggle that crossfades sun ↔ moon icons with a 90° rotate (Framer `AnimatePresence`, `mode="wait"`). It is a drop-in (same export name) so the rest of the codebase keeps working unchanged. Rebuilt `MarketingNav` as a floating glass pill that lives 12px from the top of the viewport: it has a translucent background that only materializes after 24px of scroll, the center nav links sit inside a sunken pill-within-a-pill ("Features · Universities · Library · Careers · AI" — renamed Notes→Library and Jobs→Careers for the editorial voice), and the new `Logomark` is a black ink disc with a saffron dot, paired with the Instrument Serif wordmark. CTAs use the new pill-shape primary button. Mobile drawer animates in as a separate floating card with the same radius vocabulary. Footer rebuilt as a magazine masthead: a hero callout in 8vw display serif ("Made for the *student*, by the *student*."), eyebrow micro-mono section labels (`eyebrow` class), 4-column link grid with `link-grow` underlines, and a colophon strip with the technology stack in monospace. Everything sits on the new token palette and respects both themes.
