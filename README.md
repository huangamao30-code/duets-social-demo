# Duets · Social Demo

A 4-screen social-feature demo recreated from a Figma design, built with **vanilla HTML / CSS / JS** — no framework, no build step.

| Initial gallery | Duets dashboard | Picks dashboard | Replies dashboard |
| --- | --- | --- | --- |
| Card overview with `Add Duet Now` CTA | Cyan theme + duet task list | Pink theme + shopping task list | Yellow theme + reply task list |

Designed at **420 × 912** (portrait). The layout uses CSS container-query units so every measurement (font sizes, paddings, offsets) scales smoothly down to ~320-wide phones and is capped at 420 px on desktop.

---

## Quick start

Any static file server works. From this directory:

```bash
# Option A — Python 3
python -m http.server 8000

# Option B — Node (no install needed if you have Node ≥ 14)
npx serve .

# Option C — Bun / Deno / Caddy / nginx / Live Server VS Code extension
```

Open <http://localhost:8000>.

**Test query params** (useful when sharing screenshots):
- `?screen=1` / `?screen=2` / `?screen=3` jumps straight to a swipeable screen
- `?popup=1` / `?popup=2` / `?popup=3` / `?popup=4` opens a popup over screen 1

---

## Adding the Helvetica Neue font

The CSS expects `.woff2` files at `./assets/fonts/`. Drop in whichever weights you have — the @font-face rules pick them up automatically and the fallback stack handles missing weights gracefully (`'Helvetica Neue Local' → 'Helvetica Neue' → 'Helvetica' → 'Arial' → 'PingFang SC'`).

Recommended filenames (the CSS already references these):

```
assets/fonts/
├── HelveticaNeue-Light.woff2          # weight 300
├── HelveticaNeue-Roman.woff2          # weight 400  (or HelveticaNeue.woff2)
├── HelveticaNeue-Medium.woff2         # weight 500
├── HelveticaNeue-Bold.woff2           # weight 700
├── HelveticaNeue-Heavy.woff2          # weight 900  (or HelveticaNeue-Black.woff2)
└── HelveticaNeue-HeavyItalic.woff2    # weight 900 italic
```

`.woff` files are also accepted as a secondary source. If you only have `.ttf` / `.otf`, convert with a tool like `woff2_compress` or an online converter — `.woff2` is ~30% smaller and is the modern standard.

> Helvetica Neue is a commercial font; please ensure you have a valid license for any version you embed.

---

## Deployment

### GitHub Pages (your choice)

1. Push this directory to a GitHub repo.
2. **Settings → Pages → Source: `Deploy from a branch` → `main` / root.**
3. Wait ~30 s for the first build. Your demo is live at `https://<user>.github.io/<repo>/`.

All assets are referenced with **relative paths** (`./assets/...`) so it works under any subpath without configuration.

> Heads-up on global reach: GitHub Pages serves from `github.io`, which is occasionally slow or blocked from inside mainland China. If you observe access issues, the same files redeploy to **Cloudflare Pages** or **Vercel** in under 60 seconds with no code changes — both are free and have full PRC coverage.

### Cloudflare Pages / Vercel (alternative if GH Pages is unreachable)

Push to GitHub → connect repo → set **Build output directory = root** → deploy. Zero configuration needed.

---

## Asset choices

All images and fonts are served from this repo, with **no external CDN, no Google Fonts, no analytics** — so the demo opens identically anywhere on Earth.

| Asset | Source | Purpose |
| --- | --- | --- |
| `assets/images/card-photos.png` | Original Figma asset (TikTok profile sprite) | Photo crops for the 4 duet cards on the initial screen |
| `assets/images/dotted-bg.png` | Original Figma asset | Reference only — the runtime dotted texture is CSS-generated via `radial-gradient` |
| `assets/images/reward-*.png` | Original Figma assets (transparent) | Reference only — the runtime 3D reward icons are inline SVG per theme |
| `assets/images/icon-*.png` | Original Figma assets | Reference only — runtime icons are inline SVG (sharper, no extra requests) |
| Tab / card / popup / chevron icons | Inline SVG data-URIs in CSS | Pure-vector, themeable, no separate file requests |

---

## File map

```
.
├── index.html          # 4 screens + 4 popups + canvas, one file
├── style.css           # Single design-token-driven stylesheet
├── script.js           # Swipe, transitions, popups, particles
├── assets/
│   ├── images/         # Photo sprite + reference Figma exports
│   └── fonts/          # Drop Helvetica Neue .woff2 here
└── reference/          # Local Figma renders, used during development;
                        # safe to delete before deploy
```

---

## Interactions

| Trigger | Effect |
| --- | --- |
| `Add Duet Now` (initial CTA) | Initial fades + scales out → swipe-stage fades in on screen 1, confetti burst |
| Header chevron `←` | Returns to initial |
| Tab click (Duets / Picks / Replies) | Spring-snaps to that screen, background gradient cross-fades, tasks re-animate |
| Horizontal drag/swipe on screens 1-3 | Live-tracking translate with rubber-band at edges, velocity-aware snap on release |
| Card click (deck cards) | 3D flip animation + ripple |
| `Go add now` button | Opens themed popup (Duets / Shop / Replies destination) |
| `Start` on a task row | Opens themed popup with confetti |
| `open ▾` on screen 1 | Returns to the card gallery (initial view) |
| `open ▾` on screens 2 / 3 | Opens popup 4 ("almost there" tooltip) |
| ESC or backdrop click | Closes any active popup |
| `← / →` arrow keys | Keyboard nav between screens (dev convenience) |

---

## Browser support

Targets **modern evergreen browsers** (Chrome / Safari / Firefox / Edge from 2023+):
- CSS container queries (`container-type`, `cqw`)
- `backdrop-filter` (with `-webkit-` prefix)
- CSS `@property` is not required — gradients animate via `transform: scaleX`
- `prefers-reduced-motion` collapses all animations to ~0ms for accessibility

iOS Safari and Android Chrome on modern phones render the demo identically.
