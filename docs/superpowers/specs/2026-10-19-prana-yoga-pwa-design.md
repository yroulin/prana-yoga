# Prāṇa — a quiet home yoga practice (PWA)

**Date:** 2026-10-19
**Status:** built and verified
**Path:** `/Users/admin/Projects/yoga-exercises-generator-m3flash/`

---

## 1. Concept

A quiet, offline-first PWA that builds a short yoga sequence for someone whose body
is tired, and then gets out of the way while they hold poses.

- **Subject:** a home practice, on a mat, alone, at the end of a working day.
- **Audience:** adults 25–55 with tension, no account, no tracking, no coaching jargon.
- **Primary job:** get the user moving and breathing in under a minute from opening the page.
- **The one memorable thing:** the **breath ring** — an incomplete circle that is at once the
  app icon, the hold countdown, and the breath cue. It fills as the hold runs out and its
  halo pulses on a 4-in / 6-out rhythm.

Deliberately *not*: a fitness tracker, a social feed, a streak counter, a pose-ranking game.

## 2. Name and voice

- **Name:** `Prāṇa` — Sanskrit for breath, used in English and Spanish alike.
- **Tagline EN:** `a quiet practice, one breath at a time`
- **Tagline ES:** `una práctica tranquila, respiración a respiración`
- **Voice:** plain verbs, sentence case, active voice. "Build my session", not "Get started".
  An action keeps the same name through the whole flow.
- **No emoji anywhere.** All icons are inline SVG, 1.6–1.8px stroke, `currentColor`.

## 3. Palette — "Eucalyptus Twilight"

The background is **not** a two-stop gradient. It is a vertical mist base with two heavily
blurred radial colour fields floating over it, so it reads as atmospheric light rather than a
brand swatch.

| token | light | dark |
| --- | --- | --- |
| `--ground-top` | `#E1E4E1` | `#141A1E` |
| `--ground-mid` | `#CBD6D2` | `#0F1417` |
| `--ground-bot` | `#C4CFDC` | `#0B0F12` |
| `--field-euca` | `rgba(122,158,144,.40)` | `rgba(90,130,120,.22)` |
| `--field-violet` | `rgba(126,120,166,.38)` | `rgba(110,90,134,.28)` |
| `--ink` | `#1F2A28` | `#E7E9E6` |
| `--on-ink` | `#F0EEE7` | `#1B2422` |
| `--muted` | `#4E5C59` | `#9BA8A4` |
| `--faint` | `#7E8B86` | `#74817D` |
| `--accent` | `#6E5A86` | `#A899CE` |
| `--accent-soft` | `rgba(110,90,134,.14)` | `rgba(168,153,206,.16)` |
| `--on-accent` | `#F7F3FA` | `#14171B` |
| `--glass` | `rgba(255,255,255,.40)` | `rgba(255,255,255,.055)` |
| `--glass-sunk` | `rgba(255,255,255,.26)` | `rgba(255,255,255,.035)` |
| `--glass-line` | `rgba(255,255,255,.58)` | `rgba(255,255,255,.10)` |
| `--glass-shadow` | `0 18px 50px rgba(31,42,40,.10)` | `0 18px 50px rgba(0,0,0,.45)` |
| `--sheet-bg` | `rgba(255,255,255,.82)` | `rgba(19,25,29,.90)` |
| `--paper` | `#F0EEE7` | `#F0EEE7` |
| `--paper-ink` | `#2C2825` | `#2C2825` |
| `--rule` | `rgba(31,42,40,.14)` | `rgba(231,233,230,.14)` |

**Verified contrast (light):** ink on ground 11.5:1 · muted on ground 5.3:1 ·
accent on ground 4.7:1 · on-accent on accent 5.5:1.
**Verified contrast (dark):** ink on ground 14.7:1 · muted on ground 7.5:1 ·
accent on ground 7.1:1 · on-accent on accent 7.0:1.

### Accent discipline

The violet is reserved for **the primary action** and **the live progress** — at most two
visible uses per screen. *Selected filters are filled with `--ink`, not with the accent*, and
their text uses `--on-ink` so the pair stays readable in both themes. This keeps the colour
precious instead of decorative.

### Dark mode

A re-thought palette (a night garden), not a lightness flip: the accent lifts to a pale
violet, the eucalyptus field cools, and the glass panes become near-black with a hairline
highlight. The **pose drawings keep their warm paper background in both themes** — the black
line art is unreadable on a dark ground, so it stays a lit sheet in a dark room.

## 4. Type

| role | family | usage |
| --- | --- | --- |
| display | **Cormorant Garamond** 400/500/600 | headings, pose names, the brand mark — 20px and up only |
| body / UI | **Raleway** 300/400/500/600/700 | everything else |

Cormorant is too thin for small text and is never used below 20px. Both families are
self-hosted as woff2 subsets (latin + latin-ext) so the typography survives offline.

Sentence case everywhere. The only uppercase in the product is the `IN 4 · OUT 6` breath
readout, which is a metronome rather than a label. Form-group labels are sentence case,
muted, and used only where they genuinely name a group of controls — never above a heading.

Line length ≤ 52ch for body, ≤ 60ch for the lede.

## 5. Screens

Hash-routed, one `index.html`, no build step.

### `#/` — Set the practice (the Quiet Column)

One 40rem column, centred, with generous vertical air. The four questions in order:

1. **Kind of session** — Wake up · Desk reset · Unwind · Sleep · Strong practice (required, one)
2. **Where are you tight** — up to 3 of 11 focus areas (neck, shoulders, upper back, lower
   back, hips, hamstrings, thighs, knees, ankles, wrists, tension and breathing)
3. **Length** — 10 / 20 / 30 minutes
4. **Effort** — Gentle / Steady / Strong

Then a single primary action, *Build my session*. On submit the form is **replaced** by the
session view, with a *Change the settings* link back.

### `#/session` — Your session

The sequence as a list of pose cards: the CC BY drawing on its paper tile, the pose name in
Cormorant, the sanskrit name, the hold in seconds, and one line explaining **why this pose
was chosen** for the selected focus areas. Each card has a *How to get there* disclosure that
reveals the three steps, the numbered step strip, the safety note and the source credit.
Above the list: the real total ("9 poses · 20 min"), computed from the actual holds. Actions:
*Begin practice* (primary), *Shuffle*, *Print sheet*, *Change the settings*.

### `#/play` — The player

Full-screen, no dialog chrome. A single glass card holding the drawing, the pose name, the
sanskrit name, a hold badge, all three steps, and a hold progress bar along the card's bottom
edge. Below it the **breath ring**: the ring's stroke is the hold progress, the word inside
it is *in* / *out* (inhala / exhaled in Spanish), and its halo pulses on the 4-in / 6-out
rhythm. Controls: previous, pause, next. A soft synthesised chime (WebAudio, no audio file)
marks each transition. `navigator.wakeLock` keeps the screen awake while it can. An
`aria-live` region announces the pose name and the next pose, not every second.

### `#/library` — Browse the poses

A searchable grid of all 45 poses (search matches name, sanskrit and focus areas), filter
chips for effort and a select for the focus area, and a detail dialog with the drawing, the
step strip, steps, breath cue, safety note, tags and the CC BY source link.

### Print sheet

The session view carries a print stylesheet: black on white, chrome removed, one pose per
block with its thumbnail, name, hold, reason, steps, safety note and the CC BY credit link,
plus a printed heading with the pose count and total. The steps print even though they are
collapsed on screen — the disclosure is a button over a hidden block, so `hidden` can be
overridden in print without a script. *Print sheet* calls `window.print()`.

## 6. The generator

```
score(pose) =
    +3   if pose.sessions includes the chosen session type
    +4   per focused area the pose helps
    -60  per focused area the pose loads
    -25  effort is gentle and the pose is not gentle
    -14  effort is steady and the pose is strong
    +6   effort is strong and the pose is strong
    +3   effort is strong and the pose is steady
    +2   the pose is a rest and the session is sleep or unwind
```

- **The veto is a filter, not a score.** A pose whose `loads` list contains any focused area
  is removed outright, before scoring. A score threshold would let a pose that helps three
  other areas slip through the one area it actually loads.
- Sorting is by score, descending. **Ties within a ±1.6 band are broken by a seeded PRNG**
  (mulberry32) so *Shuffle* genuinely reshuffles. The seed lives in app state and advances
  on every shuffle. The previous Stillpoint build had a dead *Reshuffle* button because
  `generateSequence()` contained no randomness at all; that defect must not recur.
- Assembly order: 1–2 `open` poses → N `main` poses → 1–2 `rest` poses, with Corpse Pose
  always last. A strong effort drops one rest pose.
- **Honest duration.** Pose count comes from the requested length (10 min → 6, 20 → 9,
  30 → 13). Holds are then distributed across the picked poses in proportion to each pose's
  base hold, clamped to 45–210s and rounded to 15s, with the remainder redistributed so the
  total lands on target. The total shown to the user is summed from the real holds, never
  estimated. The old build's "30 minutes" produced ~15 minutes of content; this one does
  not — the measured drift across every combination is 0 seconds.
- Poses are never repeated inside one session.

### Pose metadata

Each of the 45 poses carries: `id`, `name` (en/es), `sanskrit`, `level`
(gentle/steady/strong), `phase` (open/main/rest), `baseSec`, `helps[]`, `loads[]`,
`sessions[]`, `cue` (en/es), `steps[]` (3, en/es), `care` (en/es), `img`, `stepsImg`,
`source`.

## 7. Images and licence

- Source: [YogaPhilippines.com](https://yogaphilippines.com/image-license/), **CC BY 4.0**.
- 45 poses × 2 images (drawing + numbered step strip) = 90 WebP files, downloaded once and
  stored locally in `images/poses/` so the app works offline. 1.2 MB in total.
- Attribution is shown in three places as the licence requires: on every pose card, in the
  footer, and in the about dialog — always naming YogaPhilippines.com, stating CC BY 4.0,
  and linking the page the drawing came from.
- The licence also requires keeping the original safety notes when a sequence is reused, so
  every pose carries a `care` note derived from the source page's "make it easier" and
  "common mistakes" sections.
- 69 licensed pages exist; 45 are selected for safe unsupervised home practice, with every
  focus area and every effort level represented.

## 8. Internationalisation

- Two languages, English and Spanish, both first-class.
- Detection order: `localStorage` → `navigator.language` → English.
- `<html lang>` is updated on switch; every translatable node carries `data-i18n`,
  `data-i18n-html`, `data-i18n-ph`, `data-i18n-aria` or `data-i18n-content`.
- **Sanskrit, timings, levels, phases, focus-area ids, images and source URLs are shared**
  across languages. Only `name`, `cue`, `steps` and `care` are translated per pose.
- Spanish is written idiomatically, not translated literally. Session types:
  Wake up → Despertar · Desk reset → Pausa de escritorio · Unwind → Soltar ·
  Sleep → Dormir · Strong practice → Práctica fuerte.
- The two dictionaries are kept exactly parallel; `tools/check.mjs` fails if a key exists in
  one and not the other.

## 9. Accessibility

- Every control is a real `<button>`, `<input>` or `<a>`. Single-choice groups use
  `<fieldset>` + radio inputs (free arrow-key navigation); multi-select focus areas use
  `<button aria-pressed>`.
- Visible `:focus-visible` ring at 2px in the accent, offset 2px.
- Skip link to the main content that does not disturb the hash router.
- `prefers-reduced-motion` collapses every transition and disables smooth scrolling.
- The hold timer is exposed as a progress bar; pose changes are announced through a polite
  live region, never per second.
- All form labels are associated; empty states explain what to do next.
- Contrast ≥ 4.5:1 for body text in both themes (verified above).
- The top bar folds into two rows below 620px so nothing has to shrink into an icon.

## 10. Offline and PWA

- `manifest.webmanifest`: standalone, portrait, theme colour matching the active theme,
  icons at 192/512 plus a maskable 512 and an SVG.
- `sw.js`: cache-first with a same-origin runtime cache, precaching every shipped file —
  CSS, JS modules, woff2 fonts, all 90 images, icons and the worker script itself, so the
  worker can always start with the network off. Navigations fall back to `index.html`.
- The top bar shows a "Saved for offline" pill once the cache is warm.

## 11. File layout

```
yoga-exercises-generator-m3flash/
├── index.html
├── manifest.webmanifest
├── sw.js
├── styles/
│   ├── base.css        tokens, reset, typography, utilities
│   ├── layout.css      shell, top bar, quiet column, view frames
│   └── components.css  chips, panels, buttons, cards, player, library, print
├── js/
│   ├── main.js         boot, hash router, top bar, service worker
│   ├── store.js        state + localStorage
│   ├── generator.js    scoring, seeded shuffle, duration fitting
│   ├── i18n.js         runtime string lookup + DOM application
│   ├── ui.js           DOM helpers
│   ├── audio.js        WebAudio chime
│   ├── data/
│   │   ├── poses.js    45 poses, EN + ES (generated, committed)
│   │   └── strings.js  UI strings, EN + ES
│   └── views/
│       ├── home.js
│       ├── session.js
│       ├── library.js
│       └── player.js
├── fonts/              self-hosted woff2 (latin, latin-ext) + fonts.css
├── images/poses/       90 WebP drawings
├── icons/              icon.svg, 192, 512, maskable
├── tools/              one-off asset preparation, dev helpers and validation
│   ├── fetch-poses.mjs   scrape the 45 pose pages and download the drawings
│   ├── fetch-fonts.mjs   download and subset the two font families
│   ├── build-icons.mjs   rasterise the breath-ring mark
│   ├── build-poses.mjs   merge scraped English + authored metadata into js/data/poses.js
│   ├── build-sw.mjs      regenerate sw.js so the precache list matches the disk
│   ├── check.mjs         the data, dictionary, generator and anti-slop checks
│   ├── drive.mjs         drives the running app and checks what it does
│   └── shoot.mjs         headless Chrome driver for screenshots and measurements
└── docs/superpowers/specs/
```

`tools/` are **asset preparation, development helpers and validation**. The app itself has
no build step and no dependencies: `index.html`, the styles, the scripts and the assets are
the whole thing.

## 12. Anti-AI-slop compliance

| rule | how this build complies |
| --- | --- |
| default indigo accent | none — the accent is `#6E5A86`, a muted plum, not on the banned list |
| two-stop purple→blue hero gradient | the ground is a mist base + two blurred radial fields, not a brand gradient |
| emoji as feature icons | none — inline SVG only, 1.6–1.8px stroke, `currentColor` |
| sans-serif on display text | display uses `var(--font-display)` = Cormorant Garamond |
| rounded card with coloured left border | no left-border accent tiles anywhere |
| invented metrics | every number is computed from the real sequence |
| filler copy | real written copy in both languages, no lorem ipsum |
| external placeholder image CDNs | none — every image is local or self-hosted |
| more than ~12 raw hex outside `:root` | every colour is a token, including the print palette |
| `var(--accent)` used 6+ times per screen | capped at two visible uses: primary action + live progress |
| generic Hero → Features → Pricing → FAQ → CTA | no marketing page at all — the app opens on the practice |
| decorative blob / wave SVG backgrounds | the background fields are blurred colour, not geometry |
| perfect symmetry with no tension | the quiet column is deliberately narrow against a wide gradient |

## 13. Verification

`node tools/check.mjs` — the data half of the test suite:

- every pose id is unique; every pose has ≥3 steps in both languages, a non-empty cue and
  care note, a source URL, and both image files exist on disk;
- every key in `STR.en` exists in `STR.es` and vice versa; no filler copy;
- for **all** 232 focus-area combinations × 5 session types × 3 efforts × 3 lengths ×
  5 seeds (52,200 sequences), the sequence is non-empty, contains no pose that loads a
  focused area, contains no duplicate, ends with Corpse Pose, holds are in range and a
  multiple of fifteen seconds, and the total length is within 75s of the request — measured
  drift: **0 seconds**;
- the service worker precache list matches the files actually on disk, both ways;
- the manifest references icons that exist;
- the anti-slop rules above hold across the styles, the markup and the source.

`node tools/drive.mjs` — the behaviour half: drives the running app in headless Chrome and
checks the setup screen, building a session, the shuffle actually changing the sequence, the
focus areas excluding the wrong poses, the language switch, the theme switch, the library
search and its dialog, the player moving its ring and bar, the keyboard, the about dialog,
and that the page logs no errors.

Manual pass: 375 / 768 / 1024 / 1440px, light and dark, English and Spanish, keyboard only,
`prefers-reduced-motion`, print preview, and offline with the server stopped.
