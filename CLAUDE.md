@AGENTS.md

# UI conventions

This app is used primarily on phones — interactions must behave the same on touch as on a
pointer. Be deliberate about hover:

- **Avoid hover effects that change a persistent visual** (background, border, color, filter,
  transform). On touch, `:hover` sticks after a tap until the user taps elsewhere, leaving the
  effect stuck on.
- **If a hover affordance is genuinely wanted**, either gate it behind `@media (hover: hover)` so
  touch never triggers it, or mirror it on `:active` so a tap reproduces it briefly (e.g. the
  lander nav arrows).
- **Never make information or actions hover-only.** Reveal-on-hover UI (tooltips, popovers) must
  also work on tap and auto-dismiss, and should be mounted only while shown so off-screen copies
  don't expand the page's scroll region.

# Architecture

The system architecture, data model, API surface, and frontend structure are documented in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — read it before making structural changes.

@docs/ARCHITECTURE.md
