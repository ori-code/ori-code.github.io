# aChordim Project Memory

## Project Structure
- Main app: `ChordsApp/www/index.html` (uses `styles-bw.css`)
- Redesigned page: `ChordsApp/www/index_redesigned.html` (inline CSS)
- React client: `ChordsApp/client/` (separate app)
- Key JS files: `app.js`, `session-ui.js`, `live-mode.js`, `auth.js`

## Full Codebase Documentation (Feb 2026)
- [codebase-overview.md](codebase-overview.md) — Architecture, data flows, globals, Firebase structure
- [app-functions.md](app-functions.md) — app.js complete function reference (7489 lines)
- [session-livemode.md](session-livemode.md) — session-ui.js + live-mode.js function reference
- [modules-reference.md](modules-reference.md) — All smaller modules (auth, sub, pad, metronome, etc.)
- [dom-elements.md](dom-elements.md) — All key DOM IDs and CSS classes
- [rtl-implementation.md](rtl-implementation.md) — RTL (Hebrew/Arabic) implementation details

## Design System (as of Feb 2026)
- **Strict B&W only**: `#000` and `#fff` exclusively
- Dark mode (default): black bg, white text. Light mode: inverted
- Theme toggle via `theme.js` → `data-theme` attribute on `<html>`
- CSS variables: `--bg`, `--text`, `--border`, `--surface` etc.
- No shadows, no gradients, no border-radius, no colors
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- Visual hierarchy via **opacity** (0.5-0.6 for secondary, 1.0 for primary)

## Key Pattern: Safety-Net CSS Overrides
- `styles-bw.css` lines ~3321-3731: attribute selectors override inline colored styles
- Pattern: `[style*="color: #hexval"] { color: var(--text) !important; }`
- This catches JS-set inline styles that would otherwise show colors
- Must be expanded when new colored inline styles are found

## Common Pitfall
- JavaScript in `app.js`, `session-ui.js` sets colors via `.style.background = '#colored'`
- These bypass CSS rules unless caught by attribute selector overrides
- Always use `var(--text)` / `var(--bg)` in JS color assignments

## Critical Code Patterns
- **Transposition**: ALWAYS from `baselineChart` + cumulative steps (never incremental)
- **Format detection**: v4 first → normalized → legacy (this order is critical)
- **Content pipeline**: normalizeContent → convertToAboveLineFormat → autoInsertArrangementLine → ensureMetadata → reverseForRTL
- **Session callbacks**: `sessionManager.onSongUpdate/onPlaylistUpdate/onParticipantsUpdate` overridden by app.js; `onSectionSelected` by live-mode.js

## RTL (Hebrew/Arabic) — see [rtl-implementation.md](rtl-implementation.md)
- livePreview uses **CSS class** `.rtl-content` (not `dir` attr — avoids multi-column reversal)
- Editor/songbookOutput use `dir="rtl"` attr + `unicode-bidi: plaintext`
- Chord-lines: `direction: ltr + text-align: right` (NOT `direction: rtl` — would misalign chords with lyrics)
- Badges in livePreview: NO JS reversal (CSS `direction:rtl` inherited from `preview-page` handles it)
- `@@@RTL` debug markers throughout code — search to find all RTL touch points

## Documentation Update Rule
- After user approves changes and says **"update"** → update the relevant memory doc(s) in BOTH locations:
  1. `/Users/oridobosh/.claude/projects/...memory/` ← Claude's auto-loaded memory
  2. `/Volumes/1TB_EXFAT/Development www.TheFaithSound.com/ori-code.github.io/ChordsApp/www/memory/` ← project docs
- Only update the file(s) relevant to what changed (e.g. if app.js changed → update `app-functions.md`)
- Always sync both locations at the same time

## Deployment
- Firebase hosting: `firebase deploy --only hosting --public www` (from `ChordsApp/` dir)
- `firebase.json` `hosting.public` is `client/dist` (React app), override with `--public www` for main app
