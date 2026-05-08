# UniConnect — Redesign Log

A running journal of the editorial-grade frontend rebuild. One paragraph per phase.

---

## Phase 1 — Foundations (complete)

Cut the four-theme system (linen, midnight, daylight, monochrome) down to two — Light and Dark — and rebuilt the token layer from scratch. The new palette is paper-cream + editorial ink for Light, warm charcoal + lifted moss for Dark, with a single deep-moss primary, honey-saffron accent, and a six-stop hue palette (`--hue-a..f`) for places that legitimately need multi-color tags (university chips, avatars, syntax highlight). Swapped the display serif from Playfair to Instrument Serif (Google Fonts) for a sharper, more contemporary editorial voice; Geist Sans + Geist Mono remain. Rewrote `globals.css` from scratch: token blocks for two themes, motion tokens (`--ease-out-soft`, `--dur-base`, etc.), refined scrollbar/selection/focus styles, and a full animation library (marquee, aurora drift, tilt-glow, scroll progress, page fade-up, stagger reveal, link-grow, word-rise, skeleton shimmer, AI caret, ripple, confetti). Migrated every hardcoded hex inside the `coding-*` and `pk-*` (syntax highlight) classes into token references — the entire stylesheet now lives off CSS variables, so future palette tweaks happen in one place. `ThemeProvider` now does legacy migration (old `linen`/`midnight` reads remap to `light`/`dark`), respects OS preference on first visit, and exposes a `toggle()` helper. Added an inline FOUC-prevention script to `app/layout.tsx` so the chosen theme is applied before paint, removing the visibility-hidden flash.

---

## Phase 2 — Primitives (complete)

Rebuilt `Button` from the ground up: seven variants (`primary`, `accent`, `secondary`, `outline`, `ghost`, `link`, `destructive`) × five sizes × two shapes (`square`, `pill`). The hover state now uses layered shadow + 1px lift instead of the old "brightness 110" trick (which always looks cheap on light themes); active-press is `scale(0.98) translateY(1px)`; ripple is preserved. Added four new primitives the rest of the redesign builds on: `Surface` (token-driven card with `tone`, `elevation`, `radius`, and `interactive` variants), `Pill` (badge with the full hue-palette tone set baked in, used everywhere multi-color tags appear), `Field` (input wrapper with label/hint/error/prefix/suffix and a focus ring that draws a 4px primary halo), and `Kbd` (keyboard chip for the upcoming command palette). All five components live entirely on tokens — there is no raw color anywhere in `components/ui/`.
