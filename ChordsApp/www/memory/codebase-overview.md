# aChordim — Codebase Overview & Architecture

## What the App Does
Chord chart app for worship teams. Upload/paste chord charts → AI transcribes → transpose/format → display/print/share in live sessions.

## File Map

| File | Lines | Role |
|------|-------|------|
| `app.js` | 7489 | Central orchestrator: analysis pipeline, transposition, rendering, sessions, subscriptions |
| `live-mode.js` | 3918 | Full-screen performance view: display, auto-scroll, MIDI, session broadcast |
| `song-library.js` | 2358 | Save/load songs, books, bulk operations, offline sync |
| `session-ui.js` | 1617 | Session CRUD modals, playlist drag-drop, participant UI |
| `session-manager.js` | 686 | Firebase Realtime DB backend for live sessions |
| `pad-player.js` | 659 | Worship pad audio (12 chromatic pads, effects chain) |
| `chordpro-parser.js` | 550 | Parse/transpose chords, extract metadata, badge colors |
| `subscription.js` | 552 | Tier management (FREE/BASIC/PRO/BOOK), usage tracking |
| `auth.js` | 603 | Firebase Auth + multi-device session enforcement |
| `paypal-subscription.js` | 497 | PayPal subscription & one-time purchase buttons |
| `metronome.js` | 491 | Web Audio metronome (3 sounds, tap tempo, multiplier) |
| `song-search-filter.js` | 194 | Search/filter/sort song list |
| `midi-controller.js` | 355 | MIDI pedal/controller support (CC + Note mapping) |
| `offline-store.js` | 240 | IndexedDB caching for songs/books |
| `theme.js` | 69 | Dark/light theme toggle |
| `js/localization.js` | 144 | EN/HE language toggle + RTL page handling |
| `js/translations.js` | 710 | 350+ translation key-value pairs |
| `service-worker.js` | 121 | PWA caching (app shell + separate pads cache) |
| `firebase-config.js` | 21 | Firebase credentials + init |

**CSS:** `styles-bw.css` (active), `styles.css` (archived legacy colored theme)

## Script Loading Order (index.html)
```
Head: translations.js → localization.js → web-logger.js
Body: theme.js → firebase-config.js → auth.js → subscription.js →
      paypal-subscription.js → offline-store.js → song-library.js →
      song-search-filter.js → session-manager.js → session-ui.js →
      live-mode.js → midi-controller.js → pad-player.js → metronome.js →
      chordpro-parser.js → app.js
```

## Global Window Objects (inter-module communication)
| Object | Source | Role |
|--------|--------|------|
| `window.chordsAuth` | auth.js | Auth manager (sign in/out/up) |
| `window.auth` | firebase-config.js | Firebase Auth instance |
| `window.subscriptionManager` | subscription.js | Tier/usage checks |
| `window.paypalSubscriptionManager` | paypal-subscription.js | PayPal buttons |
| `window.offlineStore` | offline-store.js | IndexedDB API |
| `window.sessionManager` | session-manager.js | Live session backend |
| `window.sessionUI` | session-ui.js | Session modal controller |
| `window.liveMode` | live-mode.js | Live mode controller |
| `window.metronome` | metronome.js | Metronome engine |
| `window.padPlayer` | pad-player.js | Pad audio engine |
| `window.midiController` | midi-controller.js | MIDI handler |
| `window.chordsAppParser` | chordpro-parser.js | ChordPro parser |
| `window.themeManager` | theme.js | Theme controller |
| `window.localization` | js/localization.js | i18n manager |
| `window.t(key)` | js/localization.js | Dynamic translation |

## Key Global State (app.js)
| Variable | Purpose |
|----------|---------|
| `baselineChart` | Original chord content (pre-transpose) |
| `currentTransposeSteps` | Cumulative semitone shift from baseline |
| `originalDetectedKey` | Key before any transposition |
| `lastUploadPayload` | Base64+MIME for re-analysis |
| `currentMusicLinks` | Platform→URL map (youtube, spotify, etc) |
| `window.currentSongName` | Exposed via Object.defineProperty |

## Critical Data Flows

### 1. Analysis Pipeline
```
File/URL/Text input
  → analyzeChart()
  → POST to Cloud Function (Gemini AI)
  → removeAnalysisLines() → baselineChart
  → normalizeContent()
  → convertToAboveLineFormat()
  → autoInsertArrangementLine()
  → ensureMetadata()
  → reverseArrangementLineForRTL() (if Hebrew)
  → visualEditor + livePreview rendered
  → extractAndDisplayKey() → keySelector
  → broadcastCurrentSong() (if in session)
```

### 2. Transposition
```
applyTranspose(steps)
  → currentTransposeSteps += steps
  → transposeChart(baselineChart, currentTransposeSteps)  ← ALWAYS from baseline
  → transposeKey(originalDetectedKey, currentTransposeSteps)
  → update keySelector + detectedKeySpan
  → updateLivePreview()
```

### 3. Editor → Preview (real-time)
```
visualEditor 'input' event
  → updateSongBookFromVisual() → convertVisualToSongBook() → songbookOutput
  → updateLivePreview()
      → detect format (v4 / normalized / legacy)
      → formatV4ForPreview() or formatForPreview()
      → livePreview.innerHTML = HTML
  → updateEditorBadges() → colored section badges above editor
```

### 4. Session Multiplayer (Leader)
```
analyzeChart() completes
  → broadcastCurrentSong()
  → sessionManager.updateCurrentSong({id, name, content, key, transposeSteps})
  → Firebase: sessions/{id}/currentSong = data
```

### 5. Session Multiplayer (Player)
```
Firebase onValue triggers
  → sessionManager.onSongUpdate callback
  → app.js: handleSongUpdateFromLeader(songData)
  → if in liveMode: liveMode.updateFromBroadcast(songData)
  → load per-song prefs → update display
```

### 6. Preferences (Firebase)
```
On load (auth state change):
  → loadPrintPreviewPreferences() → apply font/layout
  → liveMode.loadLiveModePreferences() → apply live mode settings

On change:
  → savePrintPreviewPreferences() → firebase users/{uid}/printPreviewPreferences
  → liveMode.saveLiveModePreferences() → firebase users/{uid}/liveModePreferences
  → liveMode.saveSongPreferences() → sessions/{id}/playerPreferences/{uid}/{songId}
```

## Content Format Types
The app handles 3 content formats with a detection chain (check v4 first):

| Format | Identifier | Description |
|--------|-----------|-------------|
| **v4 / ChordPro** | Has `{title:}` `{key:}` `{tempo:}` directives | Modern format from AI |
| **Normalized** | Title line 1, "Key: X, BPM: Y, Time: Z" line 2 | Internal working format |
| **Legacy** | Old pipe-separated metadata | Backward compat |
| **Above-line / Visual** | Chord line above lyric line (separate lines) | Editor display format |
| **Inline / Songbook** | `[C]` brackets inline with lyrics | Export/songbook format |

## Subscription Tiers
| Tier | Scans/mo | Save | Nashville | Sessions |
|------|----------|------|-----------|----------|
| FREE | 3 | ✗ | ✗ | ✗ |
| BASIC $0.99 | 20 | ✓ | ✗ | Join only |
| PRO $1.99 | 50 | ✓ | ✓ | Create+Join |
| BOOK $9.99 | Purchased pool | ✓ | ✓ | ✗ |

## Firebase DB Structure
```
users/
  {uid}/
    subscription/
    usage/
    purchasedScans
    printPreviewPreferences/
    liveModePreferences/
      songPreferences/{songId}/duration
    sessions/{sessionId}/title
    books/{bookId}/
      songs/{songId}

sessions/
  {sessionId}/
    metadata/ (title, code, allowSingers, leaderId)
    currentSong/
    playlist/{songId}
    participants/{uid}
    playerPreferences/{uid}/{songId}/

auth-sessions/{uid}/{sessionId}  ← multi-device enforcement

public-songs/{songId}
```

## Key Pitfalls to Remember
1. **Transposition always from baseline** — Never transpose incrementally; always `transposeChart(baselineChart, currentTransposeSteps)`
2. **Format detection order** — Check v4 BEFORE normalized BEFORE legacy
3. **Pipeline order** — normalize → convertToAboveLineFormat → autoInsertArrangementLine → ensureMetadata → reverseForRTL
4. **RTL in livePreview** — Use `.rtl-content` CSS class, NOT `dir` attribute (avoids column reversal)
5. **JS inline styles** — Any `.style.color = '#hex'` must be covered by safety-net CSS overrides in styles-bw.css
6. **Session callbacks** — `sessionManager.onSongUpdate/onPlaylistUpdate/onParticipantsUpdate` are overridden by app.js; `onSectionSelected` by live-mode.js
