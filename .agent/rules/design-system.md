# Design System Rules — Plugfindr

How to build UI that is on-brand, accessible and consistent. Source of truth for brand intent is `BRAND_GUIDELINES.md`; this file turns it into implementation rules. Read with `code-style.md`.

> Items marked **[Supplied]** come from the logo files and brand document (hex values read from the SVGs). Items marked **[Recommended]** are proposed extensions; confirm before treating as final. If a design file or the repo's `ui` package disagrees with this document, flag it rather than silently choosing.

---

## 1. Principles

1. **Trust is visible.** Badges, ratings, response time and "why this match" sit at the decision point.
2. **Less searching, more getting things done.** Short paths, uncluttered screens, one primary action per view.
3. **Human first.** Lead with people and outcomes before features.
4. **Resourceful and approachable.** Friendly geometry, plain words, no corporate stiffness.
5. **Mobile-first, low-bandwidth-friendly.** Light pages, large tap targets, resilient states.
6. **Amber is the spark.** One deliberate moment of amber per view (two at most).

---

## 2. Colour

### 2.1 Core palette [Supplied]

| Token             | Hex       | Role                                                       |
| ----------------- | --------- | ---------------------------------------------------------- |
| `--pf-green`      | `#0B6B3A` | Primary brand; logo on light; primary buttons; key accents |
| `--pf-ink`        | `#10231A` | Primary text on light; "plug" on light logo                |
| `--pf-deep`       | `#0B3D26` | Dark-mode background; dark panels and hero                 |
| `--pf-mint`       | `#7BD3A0` | "findr" on dark; accents on dark                           |
| `--pf-amber`      | `#F5A623` | The person icon; sparing accent and highlight              |
| `--pf-warm-white` | `#F7F5EF` | Soft light background; text on dark                        |
| `--pf-white`      | `#FFFFFF` | Surfaces, cards, light backing                             |

### 2.2 Extended tokens [Recommended]

| Token            | Hex       | Use                                           |
| ---------------- | --------- | --------------------------------------------- |
| `--pf-green-50`  | `#E8F3EC` | Subtle backgrounds, selected rows             |
| `--pf-green-100` | `#CFE6D8` | Light tags, hover on light                    |
| `--pf-green-700` | `#095A31` | Hover/pressed for primary                     |
| `--pf-ink-700`   | `#3B4A42` | Secondary text on light                       |
| `--pf-ink-500`   | `#66756D` | Tertiary text, placeholders (large text only) |
| `--pf-line`      | `#DCE3DE` | Borders and dividers on light                 |
| `--pf-mint-100`  | `#D9F2E4` | Success background on light                   |
| `--pf-amber-100` | `#FDF0D4` | Highlight/warning background                  |
| `--pf-amber-700` | `#B26F00` | Amber-family text on light (passes contrast)  |
| `--pf-error`     | `#C62828` | Errors (tune to harmonise; confirm)           |

### 2.3 Semantic tokens (use these in components)

```css
:root {
  --bg: var(--pf-white);
  --bg-soft: var(--pf-warm-white);
  --surface: var(--pf-white);
  --text: var(--pf-ink);
  --text-muted: var(--pf-ink-700);
  --brand: var(--pf-green);
  --brand-hover: var(--pf-green-700);
  --on-brand: var(--pf-white);
  --accent: var(--pf-amber);
  --on-accent: var(--pf-ink);
  --border: var(--pf-line);
  --focus: var(--pf-green);
  --danger: var(--pf-error);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: var(--pf-deep);
    --bg-soft: #0f4a2e;
    --surface: #0f4a2e;
    --text: var(--pf-warm-white);
    --text-muted: #c9d8cf;
    --brand: var(--pf-mint);
    --brand-hover: #94ddb4;
    --on-brand: var(--pf-deep);
    --accent: var(--pf-amber);
    --on-accent: var(--pf-ink);
    --border: rgba(247, 245, 239, 0.15);
    --focus: var(--pf-mint);
  }
}
```

Also support an explicit theme switch (`data-theme="light|dark"`) in addition to the system preference.

### 2.4 Colour rules

- **Components use semantic tokens, never raw hex.** Raw hex belongs only in the token definitions.
- Proportion target: about **60% neutrals, 30% greens, 10% amber**.
- **Never use amber as text on white** (contrast about 2:1, fails). Use Ink, Plug Green, or `--pf-amber-700`.
- Use **Ink text on amber backgrounds**.
- Amber on Plug Green (about 3.3:1) and Mint on Plug Green (about 3.7:1) are for **large graphics only**, never small text.
- Mint on white or Warm White is not allowed for text.
- Do not introduce new brand hues (blues, purples, etc.) without approval. Semantic error/warning/info colours are the exception and must harmonise.
- Never rely on colour alone to convey status (pair with icon and text).

### 2.5 Contrast reference (computed from the palette)

| Pair                     | Ratio     | Verdict                                      |
| ------------------------ | --------- | -------------------------------------------- |
| Ink on White             | 16.4:1    | Excellent                                    |
| Ink on Warm White        | 15.1:1    | Excellent                                    |
| Plug Green on White      | 6.6:1     | AA, all text                                 |
| Plug Green on Warm White | 6.1:1     | AA, all text                                 |
| Warm White on Deep Green | 11.3:1    | Excellent                                    |
| Mint on Deep Green       | 6.8:1     | AA                                           |
| Amber on Deep Green      | 6.1:1     | AA                                           |
| Amber on Ink             | 8.1:1     | Excellent                                    |
| Ink on Amber             | 8.1:1     | Excellent                                    |
| Amber on Plug Green      | 3.3:1     | Large graphics only                          |
| Mint on Plug Green       | 3.7:1     | Large text/graphics only                     |
| **Amber on White**       | **2.0:1** | **Fails. Do not use for text or thin lines** |

---

## 3. Logo usage in UI

- Use the supplied **SVG** files only. Never recreate, recolour, stretch, outline, re-typeset or edit paths. Never use the JPGs in product (420 x 340, flattened).
- **Light-mode logo** on white/light; **dark-mode logo** on deep green/ink/dark.
- Wordmark is lowercase `plugfindr` with a two-tone split (`plug` / `findr`). Keep the split intact.
- **Clear space:** 1X on all sides, where X is half the symbol height (0.5X minimum in tight avatars). [Recommended]
- **Minimum size:** lockup 96 px wide (digital); symbol alone 16 px. Below the lockup minimum, use the symbol. [Recommended]
- Don't place the logo on amber, busy patterns or gradients. On photography, use a solid scrim or colour panel.
- Header: lockup top-left. Favicon/app icon: symbol only, tested at 16/32 px; app icon sits on a Deep Green or White tile, centred with padding.
- Alt text for the logo: `Plugfindr`.
- The supplied SVGs include a background card; request transparent, cropped exports rather than cropping manually.

---

## 4. Typography [Recommended]

The wordmark is outlined artwork, so no typeface is embedded. Defaults below complement its bold geometric character; replace if the original typeface is confirmed.

| Role             | Typeface                                          | Fallback                |
| ---------------- | ------------------------------------------------- | ----------------------- |
| Headlines and UI | **Plus Jakarta Sans** (SemiBold, Bold, ExtraBold) | Inter, system-ui, Arial |
| Body             | **Inter** (Regular, Medium)                       | system-ui, Arial        |
| Numbers/data     | Inter with tabular numerals                       | monospace               |

- Verify support for **Yoruba and other Nigerian-language diacritics** (`ẹ`, `ọ`, `ṣ`, combining tone marks) before locking fonts.
- Self-host fonts, subset to needed glyphs, `font-display: swap`, preload only critical weights.

### Type scale

| Style   | Size / line height          | Weight                 |
| ------- | --------------------------- | ---------------------- |
| Display | 56/60 desktop, 36/40 mobile | ExtraBold              |
| H1      | 40/46                       | Bold                   |
| H2      | 30/36                       | Bold                   |
| H3      | 22/28                       | SemiBold               |
| Body L  | 18/28                       | Regular                |
| Body    | 16/24                       | Regular                |
| Small   | 14/20                       | Regular/Medium         |
| Micro   | 12/16                       | Medium (use sparingly) |

Rules: sentence case for headings, buttons and labels; left-aligned body text; 60 to 80 character line length; minimum 16 px body on mobile; max two typefaces per page. Emphasise a single key word in a headline with `--brand` to echo the plug/findr split.

---

## 5. Spacing, layout and shape [Recommended]

- **8 px base scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96 (`--space-1` to `--space-9`).
- Grid: 12 columns desktop (max content width about 1200 px), 4 columns mobile.
- **Radius:** 8 px inputs/chips; 12 to 16 px cards; 20 px hero panels; fully rounded pills, badges, avatars.
- **Elevation:** subtle. Prefer borders (`--border`) and tonal surfaces over heavy shadows; no glows or bevels.
- **Breakpoints** (mobile-first): 360, 480, 768, 1024, 1280.
- Generous whitespace; one idea per section; one primary action per view.

---

## 6. Iconography and brand graphics

### Icons [Recommended]

- Outline style, about 2 px stroke at 24 px, round caps and joins (consistent with the symbol's rounded ticks).
- Single colour (`--text` or `--brand`); amber only to highlight one state.
- Use a consistent set (e.g. Lucide or Phosphor, regular weight), customised if needed. No filled, 3D or multi-colour icons.
- Icon-only buttons need an accessible name and a 44 px target.

### The reticle device [Supplied/Recommended]

The ring with four ticks (from the logo symbol) is the brand's graphic idea: _targeting the right person._

- **Reticle frame:** thin ring and ticks around a profile photo or highlighted match.
- **Focus marks:** four ticks as corner/edge brackets on headlines or cards.
- **Pattern:** low-opacity reticle pattern on Deep Green only; must never compete with content.
- **Loader:** ring tightening around the person icon ("Finding your plug...").
- Keep the amber person as the single colour accent when the device references the logo.

---

## 7. Components

Build from `/packages/ui`. Every component supports light and dark, all interactive states (default, hover, focus-visible, active, disabled, loading, error), and keyboard use.

### 7.1 Buttons

| Type                         | Light                           | Dark                            |
| ---------------------------- | ------------------------------- | ------------------------------- |
| Primary                      | `--brand` bg, `--on-brand` text | Mint bg, Deep Green text        |
| Secondary                    | White bg, green border + text   | Transparent, mint border + text |
| Accent (rare, high priority) | Amber bg, Ink text              | Amber bg, Ink text              |
| Text link                    | Green, underline on hover       | Mint, underline on hover        |
| Destructive                  | `--danger`                      | `--danger` (check contrast)     |

Height 48 px (44 px minimum target), 12 px radius, sentence-case labels. One primary button per view. Loading state disables double-submit.

### 7.2 Inputs and forms

- 48 px height, 8 px radius, 1 px `--border`, 2 px `--focus` ring on focus.
- **Labels above fields**; placeholders are hints, never labels.
- Errors: red text with icon and plain-language fix, associated via `aria-describedby`.
- Help text under the field. Group long forms into steps with a progress indicator.
- Phone input supports Nigerian formats (+234) and OTP entry with paste and auto-advance.
- Preserve drafts on failure; confirm before destructive actions.

### 7.3 Specialist card

Photo (rounded, optional reticle frame), name, headline, top skills (chips), location, "from" rate, badges, rating, availability, response time. Primary action: **"Request intro"**. Whole card is one accessible target with distinct inner actions (save, view).

### 7.4 Match card

Specialist card plus a **"Why this match"** block with 2 to 3 plain-language reasons. Actions: request intro, save, "not relevant" (with reason; feeds matching feedback).

### 7.5 Verification badges

- Pill or shield shape: `--brand` (Mint on dark) with Ink/Warm White text and an icon.
- **Always icon + text** ("Identity verified", "Portfolio reviewed"). Never icon-only trust marks.
- Tappable: opens an explanation of **what was checked and when**.
- **Amber is reserved for the top tier** ("Plugfindr Proven") so it keeps meaning.
- Never render a badge without a backing, current verification record.

### 7.6 Other patterns

- **Chips/tags:** `--green-50` bg, green text, 8 px radius.
- **Cards:** white/surface, 1 px border, 12 to 16 px radius, no heavy shadow.
- **Tabs, filters, sort:** large touch targets; filter drawer on mobile.
- **Rating:** stars plus numeric value and count.
- **Availability:** text + dot ("Available now", "Limited", "Booked").
- **Toasts:** short, plain, dismissible, announced to screen readers.
- **Modals/sheets:** trap focus, close on Esc, return focus; bottom sheets on mobile.
- **Avatars:** circular, initials fallback, symbol-on-deep-green for the brand.
- **Skeletons** over spinners for lists; reticle loader for "finding matches".

### 7.7 States and copy

| State           | Pattern                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| Empty search    | "No plug for that yet. Tell us who you need and we'll look." + CTA to request-a-match |
| Loading matches | Reticle loader + "Finding your plug..."                                               |
| Matches ready   | "Meet your next specialist."                                                          |
| Error           | Calm, specific, with next step; no blame                                              |
| Offline/slow    | Clear banner, retry, preserved input                                                  |
| Success         | Brief confirmation; avoid confetti-level noise                                        |

---

## 8. Voice in the interface

- Conversational, confident, plain. Nigerian-inspired but globally understandable.
- **Sentence case** for headlines, buttons and labels.
- Approved lines: master tagline **We know someone**; campaign tagline **Find the right plug**; CTAs "Tell us who you need", "Meet your next specialist", "Find your plug". Don't invent or stack taglines.
- Use "specialist" and "business". Avoid "resource", "vendor", "service provider", "leverage", "solutions".
- Keep slang **out of** legal, payments, safety and verification copy; say it plainly there.
- Never claim "verified" or "vetted" unless true and explainable.
- Currency `₦250,000`; unambiguous dates (`12 Mar 2027`).
- All strings externalised for localisation.

---

## 9. Imagery and illustration

- **Photography:** real, capable, local. Nigerian and African professionals at work in believable settings; natural, warm light; clean areas for text. Real specialists only with written consent.
- **Avoid:** handshake/network/robot clichés, generic foreign stock, heavy filters, stereotyping or exoticising Africa.
- **Illustration:** flat, geometric, built from circles, rings and rounded rectangles in palette colours. The amber person is the "found" element; others in green/neutral.
- **Data viz:** Plug Green primary series, green tints secondary, Ink text, Amber for a single highlight only. Provide text/table alternatives.
- Optimise images: modern formats, responsive sizes, explicit dimensions, lazy-load below the fold.

---

## 10. Motion [Recommended]

- 150 to 250 ms for UI transitions; up to 400 ms for larger reveals. Ease-out in, ease-in out; no bounce or elastic.
- Signature motion: the **reticle locks on** (ring tightens, ticks snap in) for match-found and loading.
- No looping decoration near reading content.
- **Honour `prefers-reduced-motion`**: replace with instant or fade-only transitions.

---

## 11. Accessibility (non-negotiable)

- Target **WCAG 2.1 AA**.
- Contrast per section 2.5; verify any new colour pair before use.
- **Visible `:focus-visible`** on every interactive element; logical tab order; skip link.
- Tap targets at least **44 x 44 px**.
- Every input labelled; errors programmatically associated; status changes announced (`aria-live`).
- Meaningful `alt` text (decorative images `alt=""`); logo alt is `Plugfindr`.
- Don't convey meaning by colour alone.
- Support 200% text scaling and reflow at 320 px width without horizontal scroll.
- Captions/transcripts for audio and video.
- Test with keyboard, screen reader and Yoruba/Igbo/Hausa diacritics.

---

## 12. Responsive and performance

- **Mobile-first** CSS; enhance at larger breakpoints.
- Target typical mid-range Android on 3G/4G: pages usable in under 3 s; keep initial JS lean; lazy-load heavy components and media.
- Avoid layout shift (reserve space for images, fonts and async content).
- Design for WhatsApp-first sharing: profile and share cards with strong contrast, minimal text, in 1:1, 4:5 and 9:16.

---

## 13. Implementation rules for agents

1. **Use tokens and `/packages/ui` components.** Don't hand-roll a button, input or card if one exists; extend the component instead.
2. **No raw hex, no magic numbers** outside the token files; use spacing, radius and type scales.
3. **Check both light and dark** and attach screenshots of each to UI PRs.
4. **Verify contrast** for any new foreground/background pair.
5. **Never alter the logo**; use supplied SVGs.
6. **Ask before** introducing a new colour, typeface, icon set, tagline or logo treatment.
7. Respect reduced-motion and keyboard access in every new interaction.
8. Keep trust UI honest: badges map to real verifications; ratings to real reviews.

---

## 14. Open design items

- [ ] Confirm the wordmark's typeface (or approve Plus Jakarta Sans / Inter)
- [ ] Transparent, cropped logo SVG exports; monochrome (Ink, White) versions
- [ ] Stacked logo and approved tagline lockups
- [ ] App icon and favicon legibility testing at 16/32 px
- [ ] Pantone/CMYK equivalents for print
- [ ] Final semantic colours (error, warning, info) harmonised with the palette
- [ ] Icon set selection and customisation
- [ ] Photography library and consent process
- [ ] Diacritic rendering test for chosen typefaces
