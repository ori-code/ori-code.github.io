# ChordsApp Changelog

## v1.7 - 2026-01-13
### Fixed
- **PayPal Book tier purchase:**
  - Removed `intent=subscription` from PayPal SDK loading to support both subscriptions AND one-time orders
  - Changed subscription button label from 'subscribe' to 'paypal' to work without intent restriction
  - Book plan one-time purchases now work correctly with `actions.order.create()`

### Improved
- **Pricing cards UI:**
  - Made pricing grids symmetrical with `grid-auto-rows: 1fr` for equal row heights
  - Added "No credit card" subtitle to Free tier for consistent card structure
  - Changed button placement to `margin-top: auto` for bottom-aligned buttons
  - Improved card styling with thicker borders (2px) for paid tiers
  - Consistent 2x2 grid layout in subscription and registration modals

### Changed
- Rebranded from AI mentions to aChordim branding
- Updated pricing card fonts: 14px headers, 24px prices, 11px features

## v1.6 - 2025-12-15
### Fixed
- **Transpose metadata corruption bug:**
  - Added missing `window.getBaselineChart()` getter function
  - Added missing `window.getCurrentTransposeSteps()` getter function
  - Fixed metadata skip pattern in `transposeVisualFormat()` to handle "Authors:" lines
  - Songs now save baseline chart and transpose steps correctly
  - Loading transposed songs no longer corrupts metadata display
- **Song loading from library bug:**
  - Fixed `songLoaded` event handler to actually process and display the baseline chart
  - Songs now properly convert from ChordPro to visual format when loaded
  - Key, BPM, and other metadata now display correctly after loading
- **Consecutive chords display bug:**
  - Fixed `convertToAboveLineFormat()` to add spaces between consecutive chords
  - Chord-only lines like `[C][C][C]` now display as "C C C" instead of "CCC"

## v1.5 - 2025-01-20
### Added
- **Add to Session from Library:**
  - New "➕" button on each song in Load Song modal
  - Add songs directly to session playlist without loading into editor
  - Opens My Sessions modal with song pre-selected
  - Automatically pre-fills song name for quick adding

### Improved
- **Session Song Management:**
  - Song content now saved with playlist items
  - Playlist refresh after adding new songs
  - Better handling of pending song data

## v1.4 - 2025-01-20
### Added
- **Independent Transpose for Live Sessions:**
  - Each participant can transpose songs to their preferred key
  - Transpose preferences saved per song during session
  - "Now Playing" banner shows leader's current song
  - "Return to Live" button to sync back to leader
  - "Follow Leader" toggle for browse/sync control

### Fixed
- Firebase rules for session participant joining

## v1.3 - 2025-01-07
### Added
- **Search and Filter for Song Library:**
  - Search box to find songs by partial name match
  - Key filter dropdown (all major/minor keys)
  - Sort options: Latest First, A-Z, BPM, Key
  - Real-time filtering and sorting
  - Filters reset automatically when opening Load Song modal
  - Smart empty state messages (no songs vs. no matches)

## v1.2 - 2025-01-07
### Added
- **Auto-fill song title when saving:**
  - Automatically extracts first line of lyrics as suggested title
  - Removes leading numbers (e.g., "171. " → "הנני כאן לפניך")
  - Auto-selects text for easy editing
  - Works with Hebrew, Arabic, and all languages

## v1.1 - 2025-01-07
### Fixed
- **Transpose now works with both chord formats:**
  - Bracketed format: `[C] [Em] [G]` (AI-analyzed songs)
  - Plain format: `B A C#m E` (manually created chord-over-lyric songs)
- Added comprehensive console logging for debugging transpose issues
- Fixed transpose function to detect format and handle accordingly

### Changed
- `transposeChart()` function now auto-detects chord format
- Added detailed logging to `applyTranspose()`, `convertToAboveLineFormat()`, and song loading

## v1.0 - Initial Release
### Features
- AI-powered chord chart analysis using Claude
- Visual chord editor with live preview
- Nashville Number System support
- Transpose functionality for bracketed chords
- Firebase authentication and song library
- Print preview with customizable font size and line height
- RTL language support (Hebrew, Arabic)
- Light/Dark theme support
- Save, Load, Update, and Delete songs
