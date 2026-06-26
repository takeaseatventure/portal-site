# takeaseat — brand & design system

The canonical, living reference is the deployed site: **`products/portal-site/`**
(`index.html` + `pro.html`), live at https://takeaseatventure.com. When building ANY
new web page, landing page, storefront, or HTML email, match this system exactly —
copy the tokens and component patterns from portal-site. Do not invent a new look per
product, and do NOT fall back to a dark "GitHub-clone" template (#0d1117 + one blue
accent + emoji icons) — that is explicitly the look we replaced.

## Brand rules
- The brand name **`takeaseat`** is ALWAYS lowercase, everywhere — titles, meta, prose,
  footers, command labels, social. Never "TakeASeat" or "Takeaseat".
- Sub-brand wordmark: `takeaseat/devtools`, with `/devtools` in the muted ink color.
- Logo mark: a `±` (plus-minus / diff) glyph in mono, paper-on-ink rounded square.
- Voice: plain, exact, developer-to-developer. Lowercase, sentence case, no hype, no
  fake metrics or social proof. Name things by what the user controls.

## Identity / thesis
"Your config, made legible." These are precise instruments for the tedious, error-prone
parts of shipping. The design should read like a well-made **engineering datasheet** —
light, exact, monospace-detailed — not a neon dark IDE. Spend boldness in ONE place
(usually a real artifact like an `.env` diff); keep everything else quiet.

## Color tokens (light "paper & ink", semantic diff accent)
```
--paper:#EBEAE3  --paper-2:#E3E2D9  --panel:#F3F2EC      /* cool newsprint surfaces */
--ink:#18211D    --ink-2:#39413B    --ink-soft:#6C726A   /* deep ink-pine text */
--rule:#CDCCC1   --rule-strong:#B7B6AA                   /* hairlines */
--add:#2C6E49    --del:#B23A2E      --signal:#0F6B57      /* diff green/red + brand teal */
```
The ONLY chromatic moments are the semantic diff colors (added/removed/missing) and the
teal `--signal` for links/hover/focus. Buttons are ink-on-paper (invert/teal on hover).
Featured/emphasis blocks invert to a solid `--ink` card (see the API terminal and the
All-Access pricing tier).

## Type
- Display: **Space Grotesk** (600/700) — headings, product names, prices.
- Body: **IBM Plex Sans** (400/500) — paragraphs.
- Mono/utility: **IBM Plex Mono** (400/500) — eyebrows, labels, prices, slugs, code,
  every artifact chip. Mono carries the "engineered" feel; use it liberally for metadata.
- Eyebrows: mono, uppercase, `letter-spacing:0.2em`, `--ink-soft`. Headings: tight
  `letter-spacing:-0.02em to -0.025em`.

## Layout & components
- Max width ~1080px, generous whitespace, hairline section dividers (no heavy boxes).
- Cards: `--panel` bg, 1px `--rule` border, 12–14px radius; hover lifts 2–3px + ink border.
- Sticky blurred header with the `±` wordmark; mono nav; one ink "pricing" CTA.
- Every tool/feature carries its REAL text-artifact (a cron string, `// TODO`, a diff,
  a size bar) instead of an emoji icon.
- Numbered markers (01/02/03) only when the content is a true sequence (e.g. activation
  steps) — not as decoration.

## Quality floor (always)
Responsive to mobile, visible keyboard focus (`:focus-visible` teal ring), and
`prefers-reduced-motion` respected. Animations restrained — a hero reveal and hover
micro-interactions, nothing more. Inline `<style>` is fine for these static pages.
