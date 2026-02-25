# session-ui.js & live-mode.js — Function Reference

---

## session-ui.js (1617 lines)

### Helper Functions (module level)
| Function | Line | Purpose |
|----------|------|---------|
| `getRelativeKeys(key)` | 5 | Circle of Fifths: returns `{fourth, fifth}` relative keys |
| `keysMatch(key1, key2)` | 31 | Normalize + compare two key strings |

### SessionUI Class Methods
| Method | Line | Params | Purpose |
|--------|------|--------|---------|
| `constructor()` | 44 | — | Init `currentSessionCode = null` |
| `showCreateSessionModal()` | 51 | — | Display modal, focus title input |
| `hideCreateSessionModal()` | 62 | — | Hide modal, clear title |
| `showJoinSessionModal()` | 73 | — | Display modal, focus code input |
| `hideJoinSessionModal()` | 84 | — | Hide modal, clear code |
| `showMySessionsModal(keepPendingSongs?)` | 96 | bool | Show modal, load sessions |
| `hideMySessionsModal()` | 112 | — | Hide modal, clear pending song state |
| `loadUserSessions()` | 125 | — | Fetch + render sessions; separate leader vs player roles |
| `editSession(sessionId, currentTitle)` | 208 | — | Prompt for new name → update Firebase |
| `deleteSession(sessionId, title)` | 228 | — | Confirm → delete session + all data |
| `removeFromMyList(sessionId, title)` | 249 | — | Remove from user's list only (non-owners) |
| `toggleSessionPlaylist(sessionId, btn, isOwner?)` | 267 | — | Toggle playlist visibility in My Sessions |
| `loadSessionPlaylistInline(sessionId, isOwner?)` | 286 | — | Load/render playlist; shows key transition hints (Circle of Fifths) |
| `editSessionSong(sessionId, songId, name)` | 365 | — | Rename song in Firebase |
| `deleteSessionSong(sessionId, songId, name)` | 382 | — | Remove song from playlist |
| `moveSessionSong(sessionId, songId, direction)` | 398 | `1\|-1` | Move song up/down (swap order values) |
| `reorderSessionSong(sessionId, fromIndex, toIndex)` | 432 | — | Reorder full playlist (drag-drop) |
| `_setupPlaylistDragDrop(container, sessionId)` | 464 | — | HTML5 + touch drag-drop; long-press (300ms) for mobile |
| `handleCreateSession()` | 636 | — | Validate title → `sessionManager.createSession()` → show indicator |
| `handleJoinSession()` | 663 | — | Validate code → `sessionManager.joinSession()` → show indicator |
| `reactivateSession(sessionId)` | 690 | — | Reactivate saved session → auto-enter Live Mode |
| `manageSession(sessionId)` | 717 | — | Open session manager via `window.liveMode` |
| `joinSessionById(sessionId)` | 730 | — | Get code → join → show active indicator |
| `addCurrentSongToSession(sessionId)` | 758 | — | Add single or bulk songs to playlist; handles pending songs |
| `showSessionActive(code, isLeader)` | 891 | — | Show status indicator with Share/Options buttons |
| `updateSideMenuSession(code, isLeader)` | 933 | — | Update sidebar: code, QR, shareable link |
| `hideSessionActive()` | 996 | — | Hide status indicator + side menu session info |
| `showShareBadge(code)` | 1012 | — | Modal with QR, join link, singer link; uses QRCode lib |
| `handleShareBadgeSingerToggle(allow, code)` | 1124 | — | Toggle singers, update UI |
| `showSessionControls()` | 1141 | — | Open controls modal, load participants + playlist |
| `hideSessionControls()` | 1160 | — | Close controls modal |
| `loadParticipants()` | 1170 | — | Load/render participants; separate singers from players |
| `loadPlaylist()` | 1226 | — | Load/render playlist; key hints; drag-drop for leader |
| `loadSongFromPlaylist(songId)` | 1296 | — | Call `window.onLoadSongFromPlaylist(songId)` |
| `editPlaylistSong(songId, name)` | 1306 | — | Leader only: rename song |
| `deletePlaylistSong(songId, name)` | 1326 | — | Leader only: delete song |
| `toggleLiveMode()` | 1344 | — | Player: toggle follow-leader mode |
| `leaveSession()` | 1374 | — | Confirm → `sessionManager.leaveSession()` → hide controls |
| `hideLiveSessionBanner()` | 1392 | — | Hide banner element |
| `endSession()` | 1402 | — | Leader: confirm → `sessionManager.endSession()` |
| `showToast(message)` | 1420 | — | Temporary notification (reuses authMessage div) |
| `updateControlsForRole()` | 1443 | — | Show/hide controls based on leader vs player role |
| `updateSingerToggle()` | 1469 | — | Update singer toggle UI with link display |
| `handleSingerToggle(allow)` | 1513 | — | Toggle singers setting |
| `addCurrentSongToPlaylist()` | 1527 | — | Leader: add editor song to active session playlist |
| `showAddFromSongbook()` | 1563 | — | Leader: open load song modal for playlist |

### Global Functions
```
window.loadMySessions()              — Load user sessions in modal
window.filterSessionsList(text)      — Filter visible sessions by title
window.sessionUI                     — Global singleton
```

### Key Patterns
- **Pending songs**: `window.pendingSongToAdd` / `window.pendingSongsToAdd` for bulk add from library
- **Role-based UI**: All controls check `sessionManager.isLeader`
- **Firebase dual-write**: Session rename updates `sessions/{id}/metadata/title` AND `users/{uid}/sessions/{id}/title`
- **Drag-drop**: Desktop=HTML5 dataTransfer, Mobile=long-press (300ms) + touch tracking + clone

---

## live-mode.js (3900+ lines)

### Top-Level State Object (`liveMode`)
| Property | Type | Purpose |
|----------|------|---------|
| `isActive` | bool | Live Mode is open |
| `controlsVisible` | bool | Bottom bar visible |
| `sidebarVisible` | bool | Playlist sidebar visible |
| `currentSongContent` | string | Full chord/lyric content |
| `currentKey` | string | Display key |
| `currentTransposeSteps` | number | Cumulative transposition |
| `currentSongId` | string | Loaded song ID |
| `currentSongName` | string | Display name with metadata |
| `displayMode` | string | `'chords'/'both'/'numbers'/'lyrics'` |
| `showBadges` | bool | Render section badges |
| `showBorders` | bool | Show chord block borders |
| `showTimeline` | bool | Show vertical auto-scroll timeline |
| `fullOverviewMode` | bool | Single-column scrollable view |
| `savedDisplaySettings` | object | State saved before full overview |
| `currentColumnLayout` | 1/2 | Column count |
| `currentFontSize` | number | Font size in points |
| `isSingerMode` | bool | Lyrics-only, no transpose |
| `isPublicViewMode` | bool | Viewing shared public song |
| `playlistLocked` | bool | Songs only changeable via playlist clicks |
| `autoScrollEnabled` | bool | Auto-scroll running |
| `autoScrollPaused` | bool | Temporarily paused |
| `autoScrollDuration` | number | Total seconds (default 180) |
| `autoScrollAnimationId` | number | requestAnimationFrame ID |
| `autoScrollManualOverride` | bool | User scrolled manually (500ms flag) |
| `songMetronomeEnabled` | object | `{songId: bool}` per-song state |
| `songPadEnabled` | object | `{songId: bool}` per-song state |
| `songPadKey` | object | `{songId: key}` per-song key |
| `songAutoScrollEnabled` | object | `{songId: bool}` per-song state |
| `_managingSessionId` | string\|null | Session ID currently open in Manage Session modal |
| `_managingIsLeader` | bool | Whether current user is leader of the managed session |
| `_addSongSelectMode` | bool | Multi-select mode active in Add Song modal |
| `_addSongSelected` | Set | Set of selected song IDs in Add Song modal |
| `_addSongCurrentList` | array | Currently rendered song list in Add Song modal (for select-all) |

### Preferences Methods
| Method | Line | Purpose |
|--------|------|---------|
| `saveLiveModePreferences()` | 47 | Save global prefs to Firebase `users/{uid}/liveModePreferences` |
| `loadLiveModePreferences()` | 73 | Load global prefs from Firebase |
| `saveSongPreferences(songId, prefs?)` | 90 | Save per-song session prefs to `sessions/{id}/playerPreferences/{uid}/{songId}/` |
| `loadSongPreferences(songId)` | 126 | Load per-song session prefs |
| `saveSongFontSize(songId, fontSize)` | 153 | Save font size |
| `loadSongFontSize(songId)` | 160 | Load font size |
| `saveSongColumnLayout(songId, cols)` | 168 | Save column count |
| `saveSongTranspose(songId, steps)` | 175 | Save transpose offset |
| `saveSongBorders(songId, show)` | 182 | Save borders visibility |
| `setFontSize(size)` | 189 | Set font size, update display, auto-save to session |

### Core Mode Methods
| Method | Line | Purpose |
|--------|------|---------|
| `enter()` | 214 | Enter Live Mode: get song, load prefs, show overlay, setup MIDI, auto-scroll, sync audio |
| `exit()` | 375 | Exit: hide overlay, cleanup timeouts/intervals, reset modes |
| `enterSingerMode()` | 458 | Simplified view: lyrics+chords, no transpose controls |
| `enterPublicViewMode(songData, songId)` | 519 | View shared public song (single song, no playlist) |
| `detectRTL(text)` | 597 | Check for RTL characters |

### Display Methods
| Method | Line | Purpose |
|--------|------|---------|
| `updateDisplay()` | 605 | Render song: `formatForPreview()` → apply badges, RTL, key/transpose |
| `toggleControls()` | 781 | Show/hide bottom control bar |
| `togglePlaylistFloat()` | 793 | Toggle playlist sidebar (close controls first) |
| `toggleControlsFloat()` | 807 | Toggle controls (close playlist first) |
| `showControls()` | 846 | Slide bottom bar in |
| `hideControls()` | 858 | Slide bottom bar out (-300px) |
| `startAutoHideTimer()` | 870 | Auto-hide controls after 5s |
| `applySavedPreferences(chartDisplay)` | 3118 | Apply column layout + button states (skip if full overview) |

### Song Content Methods
| Method | Line | Purpose |
|--------|------|---------|
| `transpose(steps)` | 884 | Transpose by semitones; update key; save per-song |
| `calculateNewKey(currentKey, steps)` | 952 | Calculate new key after transposition |
| `setDisplayMode(mode)` | 986 | Set mode ('chords'/'both'/'numbers'/'lyrics'), save |
| `toggleBadges(show)` | 1001 | Toggle section badges, save |
| `toggleBorders(show)` | 1022 | Toggle chord block borders, save |
| `toggleTimeline(show)` | 1048 | Toggle vertical timeline, save |
| `toggleAutoHidePlaylist(auto)` | 1065 | Toggle auto-hide preference |
| `setColumnLayout(cols)` | 1074 | Set columns, exit full overview if active, apply A4 height, save |
| `updateLayoutButtons()` | 1144 | Update button visual for active column |
| `toggleFullOverview()` | 1162 | Toggle full-page scrollable view; save/restore settings |
| `autoFitFontSize()` | 1273 | Binary search for optimal font size in viewport |
| `syncDisplayOptions()` | 1341 | Sync display mode/badges/columns from main editor on enter |
| `updateSessionControls()` | 1381 | Update role indicator, follow-leader toggle |
| `toggleFollowLeader(enabled)` | 1412 | Player: toggle live mode follow-leader |

### Playlist Methods
| Method | Line | Purpose |
|--------|------|---------|
| `togglePlaylist()` | 1422 | Toggle playlist sidebar |
| `setPlaylistVisible(visible)` | 1435 | Set playlist visibility immediately |
| `setPlaylistLocked(locked)` | 1450 | Lock/unlock playlist |
| `showPlaylist()` | 1463 | Load/render playlist; session code + "Manage Session" btn only in sidebar (QR moved to modal) |
| `updatePlaylistSelection()` | 1670 | Update highlight without reloading |
| `hidePlaylist()` | ~2231 | Slide sidebar out |
| `loadSongFromPlaylist(songId)` | ~2641 | Load song from Firebase → prefs → settings → audio → display |
| `updateFromBroadcast(songData)` | ~2857 | Player: receive leader broadcast → load prefs → update display |
| `removeSongFromPlaylist(songId)` | ~1732 | Leader: confirm → remove → refresh |
| `showAddSongModal()` | ~1768 | Library-style modal (B&W, matches Load Song from Library); multi-select support |
| `loadBookOptions()` | ~1822 | Load user's books into source dropdown |
| `hideAddSongModal()` | ~1865 | Hide add song modal |
| `loadAddSongList(filter?)` | ~1873 | Render songs matching library row style: number, title, author, key·BPM·time, + button |
| `filterAddSongList(query)` | ~1990 | Re-filter add song list |
| `toggleAddSongSelectMode()` | ~2038 | Toggle multi-select mode; shows/hides checkboxes and bulk bar |
| `toggleAddSongCheck(songId, checked)` | ~2055 | Toggle individual song checkbox; update row highlight + count |
| `selectAllAddSongs()` | ~2075 | Check all currently visible songs in Add Song modal |
| `addSelectedSongs()` | ~2091 | Add all checked songs to playlist then close modal |
| `addSongToPlaylist(songId)` | ~2105 | Add song: uses sessionManager for active session, direct Firebase for non-active |

### Audio & Song Metadata Methods
| Method | Line | Purpose |
|--------|------|---------|
| `toggleSongMetronome(songId, enabled)` | 1702 | Track per-song metronome, save |
| `toggleSongPad(songId, enabled)` | 1712 | Track per-song pad, save |
| `toggleSongAutoScroll(songId, enabled)` | 1722 | Track per-song auto-scroll, save |
| `convertKeyToPadKey(keyString)` | 2071 | "C Major"→"C", "C#"→"Csharp" for pad player |
| `getRelatedKeys(keyString)` | 2106 | Get relative major/minor + all keys for dropdown |
| `changeSongPadKey(songId, newKey)` | 2155 | Change pad key, enable pad, save, auto-switch if playing |
| `syncMiniAudioControls()` | 2174 | Sync metronome BPM/play and pad key/stop visual state |
| `startMiniAudioSync()` | 2212 | Start 200ms interval to sync mini controls |

### Section Navigation & MIDI
| Method | Line | Purpose |
|--------|------|---------|
| `attachSectionClickHandlers()` | 3020 | Add click listeners to section blocks (leader only) |
| `selectSection(sectionId, name)` | 3042 | Leader: highlight + broadcast selection |
| `highlightSection(sectionId)` | 3057 | Highlight with glow animation; scroll into view |
| `navigateSection(direction)` | 3156 | Move between sections (MIDI CC30/31) |
| `resetSectionIndex()` | 3191 | Reset section index on new song |
| `nextSong()` | 3198 | Load next playlist song (MIDI CC32) |
| `previousSong()` | 3232 | Load previous playlist song (MIDI CC33) |
| `initMIDI()` | 3266 | Initialize MIDI; setup scrollDown/Up/next/prev handlers |

### Session Manager Methods
| Method | Line | Purpose |
|--------|------|---------|
| `openSessionManager(sessionId?)` | ~2450 | Open modal: metadata, QR code, participants, playlist, singer link; sets `_managingSessionId` + `_managingIsLeader` |
| `copySingerLink()` | ~2393 | Copy singer link to clipboard |
| `closeSessionManager()` | ~2550 | Close modal, stop participants listener, clear `_managingSessionId` |
| `toggleAllowSingers(allowed)` | ~2560 | Leader: update allowSingers in Firebase |
| `loadSessionParticipants()` | ~2585 | Load participants from Firebase |
| `listenToParticipants()` | ~2610 | Real-time listener on participants ref |
| `renderParticipants(parts, leaderId)` | ~2630 | Render participant list with role badges, remove buttons |
| `removeParticipant(uid)` | ~2700 | Leader: confirm → remove participant |
| `endSession()` | ~2730 | Leader: confirm → end session → cleanup |
| `loadManagerPlaylist()` | ~2597 | Fetch + render session playlist in modal (two-line rows: title + key·BPM; ↑↓✎✕ buttons; key hints) |
| `managerMoveSong(songId, dir)` | ~2678 | Swap order values in Firebase (±1 direction); reload playlist |
| `managerRemoveSong(songId, name)` | ~2706 | Confirm → remove from Firebase (direct write for non-active sessions); reload |
| `managerEditSong(songId, name)` | ~2725 | Close modal → load song via `onLoadSongFromPlaylist` → show+scroll to editor |
| `_getRelativeKeys(key)` | ~2740 | Inline Circle of Fifths: returns `{fourth, fifth}` for a key string |
| `_keysMatch(key1, key2)` | ~2760 | Normalize enharmonics and compare two key strings |
| `showToast(message)` | ~2279 | Toast with fadeInOut animation |
| `copySessionLink()` | ~2374 | Copy `?join={code}` URL to clipboard (code includes dash, e.g. U3U-9PC) |
| `copySessionCode()` | ~2393 | Copy session code to clipboard |

### Auto-Scroll Methods
| Method | Line | Purpose |
|--------|------|---------|
| `setAutoScrollDuration(seconds)` | 3297 | Set duration (10s-30min), save to song |
| `parseTimeToSeconds(timeStr)` | 3312 | "3:45"→225 |
| `formatTime(totalSeconds)` | 3325 | 225→"3:45" |
| `startAutoScroll()` | 3334 | Start/resume; show timeline; save pref |
| `pauseAutoScroll()` | 3385 | Pause without stopping |
| `stopAutoScroll()` | 3404 | Full stop: reset progress, scroll, hide timeline |
| `toggleAutoScroll()` | 3443 | Play/pause toggle |
| `runAutoScroll()` | 3456 | requestAnimationFrame animation loop |
| `updateAutoScrollProgress()` | 3496 | Update progress bar, timeline, time display |
| `updateAutoScrollUI()` | 3529 | Update button text/style, duration input |
| `handleManualScroll(scrollTop)` | 3562 | Adjust progress; set 500ms manual override flag |
| `handleAutoScrollClick()` | 3597 | Click content → pause/resume |
| `saveSongDuration(songId, dur)` | 3606 | Save duration to Firebase |
| `loadSongDuration(songId)` | 3623 | Load duration from Firebase |
| `initAutoScrollForSong(songId, dur?)` | 3643 | Init: check Firebase → song data → content directive → default |
| `parseDurationFromContent()` | 3676 | Parse `{duration: M:SS}` from song content |
| `setupAutoScrollListeners()` | 3691 | Setup scroll event for manual override detection |
| `handleProgressBarClick(event)` | 3722 | Seek by clicking horizontal progress bar |
| `handleVerticalTimelineClick(event)` | 3753 | Seek by clicking vertical timeline |

### Firebase Paths Used by live-mode.js
```
users/{uid}/liveModePreferences                          — Global prefs
users/{uid}/liveModePreferences/songPreferences/{id}/duration — Per-song duration
sessions/{sessionId}/playerPreferences/{uid}/{songId}    — Per-song session prefs
sessions/{sessionId}/playlist/{songId}                   — Song data
sessions/{sessionId}/metadata                            — Title, code, allowSingers, leaderId
sessions/{sessionId}/participants                         — Real-time participant list
public-songs/{songId}                                    — Public library songs
users/{uid}/books/{bookId}/songs/{songId}                — Songs in a book
```

### Notable Pitfalls (live-mode.js)
- **Nested modes**: Can be in `isSingerMode` AND `isPublicViewMode` simultaneously
- **Display sync**: Must sync `nashvilleMode` and `liveModeDisplayMode` BEFORE calling `makeChordsBold()`
- **Section cloning**: Uses `cloneNode()` to remove/re-add click handlers (avoids duplicates)
- **Pinch zoom**: Converts px→pt (`pt = px * 0.75`) for display and saving
- **Full overview recursion**: Exits full overview when column layout changed
- **Placeholder songs**: No editor content + in session → shows "Tap to view playlist"
- **Auto-scroll manual override**: 500ms flag prevents auto-control interference after manual scroll
- **isLeader vs _managingIsLeader**: `sessionManager.isLeader` is ONLY true for the CURRENTLY ACTIVE session. When managing any session from "My Sessions" (non-active), must use `_managingIsLeader` (set by comparing `metadata.leaderId` with current user UID)
- **sessionManager.addSongToPlaylist / removeSongFromPlaylist**: Both throw if `!isLeader || !activeSession`. For non-active sessions, write directly to `sessions/{_managingSessionId}/playlist/{songId}` in Firebase
- **Modal z-index stack**: `customAlertModal` / `customConfirmModal` = 300000 > `liveAddSongModal` = 200000 > `sessionManagerModal` = 100000. Confirm dialog MUST be above session manager or the promise never resolves
- **QR/join URL**: Keep the dash in session code (`U3U-9PC` not `U3U9PC`) — Firebase stores it with dash, stripping it causes session lookup to fail
- **QR location**: QR code + Copy Link + Copy Code are in the Manage Session **modal** (not sidebar). Live sidebar shows only session code text + "Manage Session" button

### Event Listeners Setup (DOMContentLoaded)
- "Go Live" buttons → if in session → enter live mode, else show My Sessions
- Live mode content click → toggle auto-scroll pause/resume
- Pinch-to-zoom (touchstart/move/end) → adjust font size, save
- Escape key → exit Live Mode
