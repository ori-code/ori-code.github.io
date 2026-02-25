# Modules Reference — All Smaller JS Files

---

## auth.js — `ChordsAuthManager` class → `window.chordsAuth`

### State
- `currentUser`, `sessionId`, `sessionListener`
- `DEFAULT_MAX_SESSIONS = 1`

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `init()` | 12 | Listen for Firebase auth state; register sessions |
| `generateSessionId()` | 44 | Unique ID: timestamp + random |
| `getMaxSessions(userId)` | 49 | Fetch user's max session limit from Firebase |
| `registerSession(userId)` | 60 | Register session; remove oldest if at limit |
| `startSessionListener(userId)` | 104 | Listen for session invalidation (kicked out) |
| `stopSessionListener()` | 132 | Stop listening |
| `removeCurrentSession(userId)` | 140 | Remove session on logout |
| `forceLogout()` | 164 | Logout due to device limit |
| `showKickedOutModal()` | 179 | Modal when user kicked out |
| `signUp(email, pw, displayName)` | 196 | Create account, register session |
| `signIn(email, pw)` | 219 | Sign in, register session (kicks other devices) |
| `signInWithGoogle()` | 236 | Google OAuth popup |
| `signOut()` | 256 | Cleanup IndexedDB, remove session, sign out |
| `resetPassword(email)` | 286 | Send password reset email |
| `hideControlsAndEditor()` | 297 | Hide control panels on login |
| `updateUI()` | 334 | Update navbar/sidebar based on auth state |
| `showAuthModal(mode)` | 414 | Show auth modal ('login'/'signup'/'reset') |
| `closeAuthModal()` | 440 | Hide modal, clear forms |
| `showMessage(msg, type)` | 450 | Toast notification |
| `getErrorMessage(errorCode)` | 475 | Firebase error code → user-friendly message |
| `isAuthenticated()` | 492 | Check if logged in |
| `getCurrentUser()` | 496 | Get Firebase user |

### Firebase Path: `auth-sessions/{uid}/{sessionId}`

---

## session-manager.js — `SessionManager` class → `window.sessionManager`

### State
`currentUser`, `activeSession`, `activeSessionCode`, `isLeader`, `isSinger`, `inLiveMode`, `leaderCurrentSong`

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `init(user)` | 21 | Set current user; cleanup if null |
| `generateSessionCode()` | 31 | 6-char code like "A3F-7K2" |
| `createSession(title)` | 46 | PRO-only: create live session |
| `joinSession(code)` | 103 | BASIC+: join by code |
| `joinAsSinger(code)` | 181 | Join as anonymous singer |
| `joinAsParticipant(sessionId)` | 166 | Add user to participants |
| `toggleAllowSingers(allow)` | 253 | Leader: enable/disable singers |
| `getAllowSingers()` | 267 | Get singer allowance setting |
| `listenToSessionUpdates(sessionId)` | 277 | Subscribe to real-time song/playlist/participant changes |
| `updateCurrentSong(songData)` | 334 | Leader: broadcast current song |
| `updateSelectedSection(sectionId, name)` | 372 | Leader: highlight section for players |
| `addSongToPlaylist(songData)` | 390 | Leader: add song to playlist |
| `removeSongFromPlaylist(songId)` | 431 | Leader: remove song |
| `updateSongInPlaylist(songId, data)` | 444 | Update song in active playlist |
| `getParticipants()` | 473 | Fetch connected participants |
| `getPlaylist()` | 488 | Get sorted playlist |
| `toggleLiveMode()` | 502 | Player: toggle auto-sync to leader |
| `getLeaderCurrentSong()` | 518 | Get cached leader's song |
| `setLiveMode(enabled)` | 526 | Set live mode directly |
| `leaveSession()` | 536 | Leave session, mark disconnected |
| `endSession()` | 551 | Leader: end session, disconnect all |
| `getUserSessions()` | 574 | Get user's saved sessions |
| `reactivateSession(sessionId)` | 588 | Leader: reactivate ended session |
| `cleanup()` | 627 | Stop all listeners, reset state |

### Callbacks (overridden by other modules)
```
sessionManager.onSongUpdate(songData, shouldDisplay)   ← set by app.js
sessionManager.onPlaylistUpdate(playlist)              ← set by app.js
sessionManager.onParticipantsUpdate(participants)      ← set by app.js
sessionManager.onSectionSelected(sectionId, name)     ← set by live-mode.js
```

### Firebase Paths
```
sessions/{id}/metadata
sessions/{id}/currentSong
sessions/{id}/playlist/{songId}
sessions/{id}/participants/{uid}
sessions/{id}/playerPreferences/{uid}/{songId}
users/{uid}/sessions/{sessionId}
```

---

## chordpro-parser.js → `window.chordsAppParser`

### Regex Patterns
- `CHORD_REGEX`: `[A-G][#b]?(maj|min|m|dim|aug|sus|add)?[0-9]*(/[A-G][#b]?)?`
- `DIRECTIVE_REGEX`: `{(\w+):\s*([^}]*)}`
- Chord grids: Lines starting with `|` or multiple `|`
- Badges: `(I)2x`, `(V1)`, `(C)3x` with optional repeat counts

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `parseDirectives(content)` | 40 | Extract `{key: value}` directives → object |
| `parseArrangement(content, returnObjs)` | 63 | Parse arrangement badges with repeat counts |
| `parseArrangementFull(content)` | 107 | Parse returning full objects |
| `parseSections(content)` | 117 | Find section markers → `[{name, index, fullMatch}]` |
| `parseChords(line)` | 157 | Find all `[chord]` brackets → `[{chord, index}]` |
| `isChordGrid(line)` | 178 | Detect chord grid lines (with `|`) |
| `isSectionMarker(line)` | 188 | Detect section markers |
| `isDirective(line)` | 202 | Detect directive lines |
| `getNoteIndex(note)` | 213 | Get pitch index 0–11; handles enharmonics |
| `transposeChord(chord, semitones, useFlats)` | 242 | Transpose single chord |
| `transposeLine(line, semitones, useFlats)` | 288 | Transpose all `[chords]` in line |
| `transposeContent(content, semitones, useFlats)` | 304 | Full transpose: chords + grids + `{key:}` directive |
| `updateKeyDirective(content, semitones, useFlats)` | 347 | Update `{key: X}` after transposition |
| `extractMetadata(content)` | 368 | Extract title, artist, key, tempo, time, capo |
| `getBadgeColorClass(badge)` | 454 | Map badge (I, V, C...) → CSS class |
| `sectionToBadge(sectionName)` | 479 | "Verse 1"→"V1", "Chorus"→"C" |
| `stripFormatting(content)` | 512 | Remove directives, chords, grids, badges |
| `wrapChordGridChords(content)` | 527 | Add `[brackets]` to bare chords in grids |

### Transposition Logic
- `(idx + steps + 120) % 12` — wraps at 12 semitones
- Enharmonics mapped in `getNoteIndex()`: Db=C#, Eb=D#, etc.
- v4 content: uses `parser.transposeContent()`; visual: `transposeVisualFormat()`

---

## metronome.js → `window.metronome`

### State
`audioContext`, `isPlaying`, `currentBeat`, `nextNoteTime`, `bpm:120`, `beatsPerMeasure:4`, `volume:0.7`, `soundType:'click'`, `multiplier:1`, `pendingMultiplier`, `tapTimes[]`

### Scheduling
- Lookahead: 25ms interval, schedules 0.1s ahead
- Uses Web Audio `currentTime` for precise timing

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `init()` | 40 | Create AudioContext, master gain |
| `start()` | 59 | Start playback |
| `stop()` | 77 | Stop, clear timer |
| `toggle()` | 94 | Play/stop |
| `scheduler()` | 105 | Lookahead scheduling loop |
| `scheduleNote(beat, time)` | 119 | Schedule click + beat indicator |
| `nextNote()` | 136 | Advance beat; apply pending multiplier on beat 1 |
| `playClick(time, isAccent)` | 161 | Generate click/beep/wood sound |
| `setBpm(value)` | 203 | Set BPM (20–300) |
| `increaseBpm(amount)` / `decreaseBpm(amount)` | 212/219 | Adjust BPM |
| `tap()` | 226 | Tap tempo (avg last 8 taps, reset after 2s) |
| `setTimeSignature(beats, unit)` | 268 | Change time sig |
| `setVolume(value)` | 280 | Master volume 0–1 |
| `setSoundType(type)` | 310 | 'click'/'beep'/'wood' |
| `setMultiplier(value)` | 318 | Speed multiplier; queue for next beat 1 if mid-measure |
| `toggleDoubleTime()` | 339 | Toggle ×1 ↔ ×2 |
| `updateUI()` | 384 | Update play button, mini player, live mode buttons |
| `updateBpmDisplay()` | 413 | Sync BPM displays (modal, mini, live) |

### Sound Types
- `'click'`: Square wave, 1500/1200Hz, 0.03s decay
- `'beep'`: Sine wave, 1000/800Hz, 0.1s decay
- `'wood'`: Triangle wave, 1200/900Hz, 0.05s decay

### DOM IDs: `metronome-*`, `miniMetronome*`, `liveMetro*`, `metronome-beats`

---

## pad-player.js → `window.padPlayer`

### Audio Effect Chain
```
Source → LowPass → HighPass → (Dry + Reverb) → Panner → MasterGain → Output
```

### State
`audioContext`, `buffers` (decoded), `activeSources`, `gainNodes`, `masterGain`
Settings: `volume:0.7`, `crossfade:4`, `lowPassFreq`, `highPassFreq`, `reverbMix:0.3`, `pan:0`
Loading: `isLoading`, `rawAudioCache` (fetch-only cache, no decode)

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `preloadFiles(onProgress)` | 92 | Phase 1: Fetch pad files as raw ArrayBuffers (no decode) |
| `init()` | 144 | Init AudioContext; create effect chain |
| `createReverbImpulse(duration, decay)` | 213 | Generate synthetic reverb impulse |
| `loadSounds(onProgress)` | 231 | Phase 2: Decode all pads (or from preloaded cache) |
| `loadSingle(key, onProgress)` | 317 | On-demand: fetch + decode single pad |
| `isPlaying(key)` | 299 | Check if key currently playing |
| `toggle(key)` | 306 | Toggle pad on/off |
| `play(key)` | 353 | Play looping pad with crossfade; auto-load if needed |
| `stop(key)` | 413 | Stop pad with fade-out |
| `stopAll()` | 446 | Stop all pads (6s fade) |
| `stopWithFade(key, fadeTime)` | 455 | Stop with custom fade duration |
| `setVolume(value)` | 488 | Master gain 0–1 |
| `setCrossfade(value)` | 502 | Fade duration (2.5–8s) |
| `setLowPass(value)` | 511 | Filter: 0–1 maps to 200–20000Hz |
| `setHighPass(value)` | 529 | Filter: 0–1 maps to 20–2000Hz |
| `setReverb(value)` | 546 | Wet/dry mix (0=dry, 1=full) |
| `setPan(value)` | 566 | Stereo pan (-1 left, 0 center, 1 right) |
| `updateKeyUI(key, isPlaying)` | 580 | Update button states in modal + mini player |
| `updateNowPlaying()` | 618 | Display currently playing keys |
| `getPlayingKeys()` | 651 | Get active source keys |

### Pad Keys
12 chromatic: C, Csharp, D, Dsharp, E, F, Fsharp, G, Gsharp, A, Asharp, B
Files: `./pads/{Key}.mp3`

### DOM IDs: `pad-key-{key}`, `.mini-pad-key[data-key]`, `padsNowPlaying*`, `miniPadStop`

---

## midi-controller.js → `window.midiController`

### State
`enabled`, `midiAccess`, `learningAction`, `lastMidiTime`, `DEBOUNCE_MS:200`
Default CC mappings: CC#30=scrollDown, CC#31=scrollUp, CC#32=nextSong, CC#33=prevSong

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `init()` | 31 | Request MIDI access, setup listeners |
| `setupListeners()` | 66 | Attach `onmidimessage` to all inputs |
| `onStateChange(event)` | 76 | Handle device connect/disconnect |
| `handleMessage(event)` | 97 | Parse CC/Note messages; debounce |
| `triggerAction(ccNumber)` | 152 | Execute action mapped to CC |
| `learn(action)` | 179 | Enter learn mode |
| `cancelLearn()` | 194 | Exit learn mode |
| `setMapping(action, value)` | 205 | Save mapping, update display |
| `saveMappings()` | 259 | Save to Firebase or localStorage |
| `loadMappings()` | 283 | Load from Firebase or localStorage |
| `getDevices()` | 329 | Get connected MIDI inputs |
| `isSupported()` | 347 | Check Web MIDI API availability |

### Learn Mode
- CC message: `value > 64` = pressed → captures CC# (positive)
- Note: captures as negative value to distinguish from CC

### Actions (set by live-mode.js)
`scrollDown`, `scrollUp`, `nextSong`, `prevSong`

---

## offline-store.js → `window.offlineStore`

### DB Schema
- `songs`: keyPath='id', index='userId', index='updatedAt'
- `books`: keyPath='id', index='userId'
- `meta`: keyPath='key' (for timestamps, counters)

### Methods
| Method | Line | Purpose |
|--------|------|---------|
| `open()` | 9 | Open/create IndexedDB (DB_NAME:'achordim-offline', v1) |
| `tx(storeName, mode, fn)` | 43 | Run IDBTransaction, return Promise |
| `getAllSongs(userId)` | 61 | Query songs by userId index |
| `putSong(userId, songId, songData)` | 73 | Insert/update single song |
| `putSongs(userId, songsMap)` | 84 | Batch insert songs |
| `deleteSong(userId, songId)` | 98 | Delete single song |
| `deleteAllSongs(userId)` | 109 | Delete all user's songs |
| `getLastSyncTime(userId)` | 126 | Get last sync timestamp |
| `setLastSyncTime(userId, ts)` | 137 | Set last sync timestamp |
| `getSyncCount(userId)` | 148 | Get sync operation count |
| `incrementSyncCount(userId)` | 159 | Increment + return count |
| `getAllBooks(userId)` | 173 | Query books by userId |
| `putBooks(userId, booksMap)` | 185 | REPLACE all user's books (clear then insert) |
| `deleteAllBooks(userId)` | 206 | Delete all user's books |

### Meta Keys: `'lastSync_' + userId`, `'syncCount_' + userId`

---

## subscription.js → `window.subscriptionManager`

### Tier Configs
| Tier | Scans/mo | canSave | canNashville | canCreateSession | canJoinSession |
|------|----------|---------|--------------|-----------------|----------------|
| FREE | 3 | ✗ | ✗ | ✗ | ✗ |
| BASIC | 20 | ✓ | ✗ | ✗ | ✓ |
| PRO | 50 | ✓ | ✓ | ✓ | ✓ |
| BOOK | pool | ✓ | ✓ | ✗ | ✗ |

### Key Methods
| Method | Line | Purpose |
|--------|------|---------|
| `init(user)` | 128 | Load subscription, usage, purchased scans |
| `loadUserSubscription()` | 146 | Fetch/create subscription from Firebase |
| `loadUserUsage()` | 183 | Fetch/create usage counters |
| `canAnalyze()` | 312 | `true` if scans remaining |
| `getRemainingAnalyses()` | 334 | Scans left this month (or pool) |
| `incrementAnalysisCount()` | 353 | Server call: increment; Cloud Function validates atomically |
| `canSaveSongs()` | 411 | BASIC+ check |
| `canUseNashvilleNumbers()` | 420 | PRO check |
| `canCreateSession()` | 429 | PRO check |
| `canJoinSession()` | 438 | BASIC+ check |
| `updateSubscription(tier, paypalId)` | 447 | Update tier in Firebase |
| `cancelSubscription()` | 467 | Mark as canceled |
| `onSubscriptionChange(callback)` | 482 | Register change listener |
| `getUsageSummary()` | 512 | Formatted display data |
| `refreshUserUsage()` | 503 | Reload usage before modal |

### Environment Detection
- localhost / 192.168.* / 10.0.* / 172.16.* → `'sandbox'`
- Production URL → `'production'`

### Firebase Paths
```
users/{uid}/subscription/
users/{uid}/usage/
users/{uid}/purchasedScans
```

---

## song-search-filter.js

### Global Variables
`window.allLoadedSongs`, `window.filteredSongs`, `window.publicSongsCache`, `window.isShowingPublicSongs`, `window.selectedBookId`

### Functions
| Function | Line | Purpose |
|----------|------|---------|
| `extractBPM(content)` | 12 | Regex `BPM[:\s]*(\d+)` → number |
| `normalizeKey(key)` | 19 | "E Major"→"E", "A Minor"→"Am" |
| `filterAndSortSongs()` | 39 | Apply search+key+book filter+sort → `window.filteredSongs` |
| `resetSongFilters()` | 116 | Clear search/key (keep book selection) |
| `initSongSearchFilter()` | 128 | Setup event listeners on filter controls |

### Sort Options: `name` (A-Z), `bpm` (high-low), `key` (A-Z), `date` (recent first)

### Book Filter Special: `'__PUBLIC__'` selected → `window.loadPublicSongs()` (async on-demand)

---

## theme.js → `window.themeManager`

### Methods
| Method | Purpose |
|--------|---------|
| `init()` | Load saved theme; setup toggle listeners |
| `toggleTheme()` | Switch dark ↔ light |
| `setTheme(theme, animate)` | Set `data-theme` attr on `<html>`, localStorage, update UI |
| `getCurrentTheme()` | Returns 'dark' or 'light' |

### Integration
- Sets `<html data-theme="light">` (absent = dark)
- localStorage key: `'chordsapp-theme'`
- Syncs: `#themeToggle` button + `#sideMenuDarkMode` checkbox

---

## js/localization.js → `window.localization`, `window.t(key)`

### Methods
| Method | Purpose |
|--------|---------|
| `init()` | Inject language toggle; apply initial language |
| `injectToggle()` | Create HE/EN button in navbar |
| `toggleLanguage()` | Switch en ↔ he |
| `setLanguage(lang)` | Apply language; set doc.lang; update UI; dispatch event |
| `updateUI()` | Update `[data-i18n*]` attribute elements |
| `get(key)` | Get translation string dynamically |

### i18n Attributes on HTML Elements
- `data-i18n` — text content
- `data-i18n-html` — HTML content
- `data-i18n-placeholder` — placeholder
- `data-i18n-title` — tooltip

### Events
- Dispatches: `'languageChanged'` custom event with `{ lang }`
- localStorage key: `'achordim_lang'`

### RTL Note
- `document.documentElement.dir = 'ltr'` (UI layout stays stable)
- But applies `dir = 'rtl'` to `.hero`, `.workflow`, `#featuresModal`

---

## js/translations.js
```
window.translations = {
  en: { 350+ key-value pairs },
  he: { 350+ key-value pairs (Hebrew) }
}
```
Categories: nav, hero, workflow, preview, menu, session, auth, modal, pricing, features, branding, footer

---

## paypal-subscription.js → `window.paypalSubscriptionManager`

### Button Types
- **Subscription**: `createSubscription()` → monthly recurring (BASIC, PRO)
- **One-time**: `createOrder()` + `capture()` → (BOOK, SCAN packs)

### Key Methods
| Method | Line | Purpose |
|--------|------|---------|
| `init()` | 77 | Load PayPal SDK script dynamically |
| `createSubscriptionButton(planType, containerId)` | 117 | Render PayPal subscription button |
| `handleSubscriptionApproval(planType, subscriptionId)` | 191 | Update tier in Firebase |
| `cancelSubscription(subscriptionId)` | 256 | Call server to cancel with PayPal |
| `createBookPurchaseButton(containerId)` | 296 | One-time purchase button |
| `createScanPackButton(packType, containerId)` | 360 | Scan pack purchase button |
| `handleBookPurchaseApproval(orderId)` | 436 | Set BOOK tier, add 20 initial scans |
| `handleScanPackApproval(packType, scans, orderId)` | 454 | Add scans to account |

### Scan Packs (global `window.SCAN_PACKS`)
`STARTER` (5 scans), `VALUE` (15 scans), `BUNDLE` (50 scans)

---

## service-worker.js

### Caching
- **Main cache**: `'achordim-v65'` (increment on deploys)
- **Pads cache**: `'achordim-pads-v1'` (separate, survives version bumps)

### Fetch Strategies
| Request | Strategy |
|---------|----------|
| Pad MP3s | Cache-first (stale OK) |
| Firebase/CDN/PayPal | Network-first (update cache) |
| Local app files | Cache-first + background update |

### Events: `install` (precache), `activate` (delete old caches), `fetch` (route requests)

---

## firebase-config.js
```
Project ID: chordsapp-e10e7
Auth Domain: chordsapp-e10e7.firebaseapp.com
RTDB URL: chordsapp-e10e7-default-rtdb.firebaseio.com
App ID: 1:313148138831:web:720b8e97cde4f68e5f913a
```
Exports: `window.auth` (Firebase Auth instance)
