# RTL (Right-to-Left) Implementation Guide

## Overview
Hebrew/Arabic songs need RTL layout. The challenge: chord lines are Latin text (LTR) positioned spatially above Hebrew lyrics (RTL). Multiple rendering contexts (textarea, livePreview HTML, songbookOutput) must produce identical visual results.

---

## Key Insight: `unicode-bidi: plaintext`

The textarea (visualEditor) uses `unicode-bidi: plaintext` (set in `setDirectionalLayout()`). This means **each line determines its OWN base direction** from its first strong character:
- Hebrew line `אתה יושב` → RTL base → right-aligned, flows right-to-left
- Chord line `C    Em` → LTR base (Latin chars) → right-aligned but preserves `C...Em` order
- This means chord positions naturally align with the lyrics below them

**The livePreview must match this behavior.** Chord-lines must NOT use `direction: rtl` — that would reverse chord positions relative to lyrics.

---

## Two RTL Paths in `setDirectionalLayout()` (app.js ~line 2676)

| Element | RTL Method | Why |
|---------|-----------|-----|
| `livePreview` | CSS class `.rtl-content` toggle | `dir="rtl"` on a `column-count:2` container reverses column fill order (right column fills first). Class avoids this. |
| `visualEditor`, `songbookOutput`, others | `dir="rtl"` attribute + inline styles | Standard approach. Also sets `unicode-bidi: plaintext`. |
| `preview-page` (ancestor) | `dir="rtl"` attribute | Drives `.preview-page[dir="rtl"]` CSS selectors (logo flip, etc.) |

---

## CSS Selectors Pattern

Every RTL CSS rule needs TWO selectors to cover both paths:
```css
[dir="rtl"] .some-element,                /* covers editor/songbookOutput */
.live-preview.rtl-content .some-element { /* covers livePreview */
    /* RTL styles */
}
```

---

## Chord-Line RTL Rules (styles-bw.css ~line 1392)

```css
[dir="rtl"] .chord-line,
.live-preview.rtl-content .chord-line {
    direction: ltr !important;   /* KEEP LTR — preserves authored chord positions */
    text-align: right !important; /* right-align to match RTL lyrics below */
}
```

**Why `direction: ltr` (not `rtl`):**
The chord line `C    Em` is authored so `C` at position 0 aligns with the first Hebrew word at position 0. Both lines are right-aligned. If we set `direction: rtl`, the `<b>C</b>` element would jump to the right edge and `<b>Em</b>` to the left — reversing positions and misaligning chords with lyrics.

With `direction: ltr + text-align: right`, the HTML `<b>C</b>&nbsp;&nbsp;&nbsp;<b>Em</b>` renders as `C   Em` right-aligned — matching the textarea's `unicode-bidi: plaintext` behavior.

---

## Badge Row RTL

Badges like `[I] [V1] [PC] [C] [V2] [C] [B] [O]` are flex items in `.section-badges-row`.

**In the textarea:** JS function `reverseArrangementLineForRTL()` reverses badge text: `(I)(V1)(C)` → `(C)(V1)(I)`. With `unicode-bidi: plaintext`, this Latin text renders LTR, so visually `(C)(V1)(I)` right-aligned. Reading right-to-left: `(I)` first — correct!

**In the livePreview:** The badge row inherits `direction: rtl` from `preview-page[dir="rtl"]`. This reverses flex item order automatically. So HTML order `[I, V1, PC, C]` displays as `[C, PC, V1, I]` left-to-right, reading right-to-left: `[I]` first — correct!

**CRITICAL: Do NOT JS-reverse badges in `formatV4ForPreview`** — that would double-reverse (JS reverse + CSS direction:rtl reverse = back to original = wrong).

| Context | JS Reversal? | CSS direction:rtl? | Result |
|---------|-------------|-------------------|--------|
| textarea (editor) | YES (`reverseArrangementLineForRTL`) | NO (unicode-bidi:plaintext → LTR for Latin) | Correct |
| livePreview (`formatV4ForPreview`) | NO | YES (inherited from preview-page) | Correct |
| legacy format (`convertBadgeLineToStyled`, `formatForPreview`) | YES | Depends on context — may need review | Check for double-reversal |

---

## Content Processing Paths (app.js `updateLivePreview` ~line 3640)

```
PATH A: isV4Format || isNormalizedFormat
  → formatForPreview() → formatV4ForPreview()
  → Handles both inline [chord] brackets AND above-line chords
  → Chord-only detection via regex, wraps in <div class="chord-line">

PATH B: legacy format (no Key:/BPM metadata)
  → makeChordsBold() preprocesses content (adds <b> tags)
  → formatForPreview() handles remaining formatting
  → WARNING: makeChordsBold wraps chords in <b>, which breaks
    formatV4ForPreview's chord-only line detection (tokens like
    <b>Em</b> don't match chord regex). This is why PATH A
    bypasses makeChordsBold for v4/normalized formats.
```

### Chord-Only Line Detection (formatV4ForPreview ~line 3142)
```javascript
const tokens = trimmedLine.split(/\s+/).filter(t => t.length > 0);
const isChordOnlyLine = tokens.length > 0 &&
    tokens.every(token => /^[A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add|sus2|sus4)?[0-9]*(?:\/[A-G][#b]?)?$/.test(token)) &&
    !trimmedLine.includes('|');
```
If detected, line gets `<div class="chord-line">` with `&nbsp;` preserving spacing.
If NOT detected, line gets `<div class="lyric-line">` — and chord-line CSS won't apply.

---

## Normalized Format Detection
```javascript
const isNormalizedFormat = /Key:\s*[A-G][#b]?.*,.*\d+\s*BPM/i.test(content);
```
Matches: `Key: Eb, 120 BPM, 4/4` (comma-separated metadata on one line)

---

## Common Bugs & Fixes History

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `.live-preview[dir="rtl"]` selectors never match | Switched to class-based RTL for livePreview | Replace all with `.live-preview.rtl-content` |
| Chord positions reversed in preview vs editor | `direction: rtl` on `.chord-line` reversed inline element order | Changed to `direction: ltr` |
| Badges show in wrong order in preview | JS reverse + CSS direction:rtl = double reversal | Removed JS reverse in `formatV4ForPreview` |
| Chord lines get `.lyric-line` class | `makeChordsBold` adds `<b>` tags before detection | PATH A bypasses `makeChordsBold` for normalized format |
| `flex-direction: row-reverse` unreliable for badges | CSS approach doesn't work consistently | Use JS array `.reverse()` where needed |

---

## Debug Markers
`@@@RTL` comments and console.logs are scattered throughout the code for tracing. Search for `@@@RTL` to find all RTL touch points. These should be cleaned up once RTL is stable.

### Key debug log points:
- `setDirectionalLayout`: logs element, isRTL, direction, which path taken
- `formatV4ForPreview`: logs entry, cleanContent, arrangement parsing, badge order
- `updateLivePreview`: logs PATH A vs PATH B decision
- Per-line chord detection: logs token matching results

---

## Files Involved
- **`app.js`**: `detectRTL()`, `setDirectionalLayout()`, `reverseArrangementLineForRTL()`, `formatV4ForPreview()`, `formatForPreview()`, `updateLivePreview()`, `makeChordsBold()`
- **`live-mode.js`**: Duplicate `detectRTL()`, badge ordering for live mode chart display
- **`styles-bw.css`**: All `[dir="rtl"]` and `.live-preview.rtl-content` CSS rules
- **`index.html`**: `editor-preview-wrapper` has hardcoded `dir="ltr"` (intentional — prevents RTL from affecting wrapper layout)
