# app.js — Complete Function Reference

## Top-Level Constants & State

### Global Config
| Name | Purpose |
|------|---------|
| `API_URL` | Cloud Function for chart analysis (Gemini) |
| `SAMPLE_CHART` | Demo song content (Great Are You Lord) |
| `NOTES_SHARP` | Chromatic scale with sharps |
| `NOTES_FLAT` | Chromatic scale with flats |
| `ENHARMONIC_EQUIV` | Flat/sharp equivalences (Db↔C#) |
| `CHORD_REGEX` | Pattern: `[C]`, `[Em7]`, `[D/F#]` |
| `A4_PRINTABLE_HEIGHT_PX` | 1047px at 96 DPI |
| `NASHVILLE_MAJOR` / `NASHVILLE_MINOR` | 12 keys × chord→number mapping |

### Song State
| Variable | Purpose |
|----------|---------|
| `baselineChart` | Original content pre-transpose — ALWAYS transpose from this |
| `currentTransposeSteps` | Cumulative semitones from baseline |
| `originalDetectedKey` | Key before any transposition |
| `lastUploadPayload` | `{base64Data, mimeType}` for re-analysis |
| `lastRawTranscription` | Full AI output including analysis section |
| `currentSongName` | Current song name (exposed via Object.defineProperty) |
| `currentMusicLinks` | `{youtube: url, spotify: url, ...}` |
| `currentKey` | Active display key (e.g., "C Major") |

### Layout State
| Variable | Purpose |
|----------|---------|
| `detectedLayout` | AI-detected columns (1 or 2) |
| `followArrangementEnabled` | Toggle arrangement-based content reordering |
| `currentSessionSongId` | ID of song in active session |
| `isFollowingLeader` | Whether player is following session leader |

---

## Functions by Category

### A. Initialization & Utilities

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `initPreviewScaling()` | 177 | — | IIFE: auto-scale A4 preview to fit screen |
| `normalizeKey(key)` | 264 | key:string | "Gm"→"G Minor", "G"→"G Major" |
| `detectRTL(text)` | 2695 | text:string | `true` if Hebrew/Arabic chars present |
| `setDirectionalLayout(el, content)` | 2704 | element, content | Set RTL/LTR on element (@@@RTL) |
| `normalizeSection Header(name)` | 2481 | sectionName | "VERSE 2:"→"Verse 2:" (Title Case) |
| `translateSectionName(name)` | 2866 | name | "Verse 1"→"בית 1" if Hebrew active |

### B. File Upload & Analysis

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `handleFileSelection()` | 1371 | — | File input change: show preview image/PDF |
| `analyzeChart()` | 1518 | — | POST to Cloud Function; normalize; extract key |
| `setStatus(state, msg, progress)` | 1055 | — | Update status indicator (color + text + % bar) |
| `resetPreview(message)` | 1087 | — | Clear image preview, lastPayload |
| `extractAndDisplayKey(transcription)` | 1208 | — | Scan for `{key: X}` → update dropdown, BPM, Time |
| `extractAndApplyLayout(transcription)` | 1338 | — | Find `{layout: 1/2}` → apply to columnCount |

### C. Content Normalization & Format Conversion

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `normalizeContent(content)` | 823 | content | Hybrid→clean "Title\nKey,BPM,Time" format |
| `removeAnalysisLines(text)` | 1157 | text | Strip AI analysis bullets, markdown blocks |
| `addCommentMarkers(text)` | 1126 | text | Wrap section headers in `{comment: }` tags |
| `convertToAboveLineFormat(text, compact)` | 2494 | text, compact | `[C]chord inline` → chord line + lyric line |
| `convertVisualToSongBook(visualText)` | 2742 | visualText | Reverse: above-line → `[C]` inline format |
| `normalizeMetadataSpacing(content)` | 4750 | content | Ensure "Key: X \| BPM: Y \| Time: Z" consistency |
| `ensureMetadata(content)` | 4770 | content | Add default BPM:120 and Time:4/4 if missing |
| `window.processAITextResult(transcription)` | — | text | Direct AI text input (not image upload) |

**Pipeline order (CRITICAL):**
1. `normalizeContent()`
2. `convertToAboveLineFormat()`
3. `autoInsertArrangementLine()`
4. `ensureMetadata()`
5. `normalizeMetadataSpacing()`
6. `reverseArrangementLineForRTL()` (if Hebrew)

### D. Transposition

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `applyTranspose(steps)` | 2008 | steps:number | MAIN HANDLER: cumulative steps, transpose all content, update key dropdown |
| `transposeChart(source, semitoneShift)` | 1745 | source, shift | Detect format → call appropriate transpose fn |
| `transposeChord(symbol, shift)` | 1873 | symbol, shift | Handle slash chords (D/F#→E/G#) |
| `transposeChordRoot(token, shift, forceFlat)` | 1888 | — | Core: C+2=D; use flats for bass notes |
| `transposeKey(keyName, steps)` | 1913 | key, steps | "C Major"+2="D Major" |
| `transposeVisualFormat(content, steps)` | 1930 | content, steps | Transpose above-line format, preserve spacing |
| `reverseArrangementLineForRTL(content)` | 2828 | content | Reverse badge order for RTL display in textarea |

### E. Preview & Rendering

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `updateLivePreview()` | 3661 | — | Render visualEditor→HTML in livePreview |
| `formatV4ForPreview(content, options)` | 2884 | — | Modern v4: extract metadata, parse arrangement, render sections |
| `formatForPreview(content, options)` | 3306 | — | Legacy: parse lines→HTML with badges, sections, lyrics |
| `makeChordsBold(content)` | 3719 | content | Wrap chords in `<b>` tags; handle Nashville; RTL logic |
| `addNashvilleNumbers(content, key)` | 3902 | — | Insert Nashville numbers into bold chord tags |
| `updateSongBookFromVisual()` | — | — | convertVisualToSongBook → songbookOutput.value |

### F. Layout & Pagination

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `updateA4Indicator()` | 3950 | — | Position dotted line at A4 page boundary |
| `updatePagination()` | 3972 | — | Calculate pages; update "Page X of Y" |
| `autoFitContent(pages)` | 4139 | pages | Binary search: optimal font size for N pages |
| `autoAdjustLayoutAfterTranspose(targetPages)` | 4193 | targetPages | After transpose: adjust font to maintain page count |
| `autoOptimizeLayout()` | 4298 | — | Fit song on 1 page (binary search) |
| `applyLayoutSettings()` | 4374 | — | Apply column/page dropdowns → set CSS |
| `checkContentOverflow()` | 4045 | — | If content > pages → show warning toast |
| `showOverflowNotification(cur, exp, over)` | 4013 | — | Toast: "X pages over limit" |

### G. Arrangement & Structure

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `autoInsertArrangementLine(content)` | 4442 | content | Add default "(I)(V1)(PC)(C)(V2)(PC)(C)(B)(C)(O)" if none |
| `getArrangementTags(content)` | 4513 | content | Extract `[V1, C, V2, C, B, C, O]` from `(I)(V1)(C)` line |
| `parseSectionsFromContent(content)` | 4542 | content | Build `{Intro: "...", Chorus: "..."}` map |
| `rebuildByArrangement(content)` | 4621 | content | Reorder sections per arrangement; repeats = headers only |
| `updateEditorBadges()` | 4824 | — | Scan visual editor for tags → render colorful badges above editor |

### H. Music Links

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `initMusicSection()` | 7156 | — | Initialize music UI on load |
| `openMusicModal()` | 7215 | — | Show modal for adding music link |
| `closeMusicModal()` | 7245 | — | Hide modal |
| `saveMusicLink()` | 7255 | — | Extract platform+URL from input; update visualEditor |
| `detectPlatform(url)` | 7194 | url | Regex: youtube/spotify/apple/soundcloud/generic |
| `detectPlatformFromInput()` | 7169 | — | Live detection as user types |
| `updateMusicLinkInContent(platform, url)` | 7299 | — | Add/update "YouTube: https://..." in editor |
| `removeMusicLink(platform)` | 7334 | — | Delete music link line from editor |
| `checkForMusicLinks()` | 7352 | — | Scan editor for existing links; update UI |
| `updateMusicUI()` | 7374 | — | Show/hide YouTube player, other platform buttons |

### I. Session / Multiplayer

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `broadcastCurrentSong()` | 6146 | — | Leader: send song content+key+transposeSteps |
| `handleSongUpdateFromLeader(songData, display)` | 6179 | — | Player: receive leader's song; load into editor |
| `updateNowPlayingBanner(name, showReturn)` | 6270 | — | Show/hide "Now Playing" bar |
| `returnToLeaderSong()` | 6289 | — | Sync player back to leader's current song |
| `addCurrentSongToPlaylist()` | 6312 | — | Leader: add analyzed song to session playlist |

### J. Subscription & Auth

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `updateUsageDisplay()` | 5475 | — | Sync header/sidebar usage indicators |
| `initSubscriptionUI()` | 5644 | — | Attach click handlers to upgrade buttons |
| `initPayPalButtons()` | 5746 | — | Create PayPal subscription buttons |
| `updateSubscriptionModal()` | 5777 | — | Render pricing cards; highlight tier; show PayPal |
| `handleSubscriptionChange(data)` | 6024 | — | On plan change: refresh UI |
| `updateSessionButtonsVisibility()` | 6111 | — | Show/hide session buttons by tier |

### K. Preferences

| Function | Line | Params | Purpose |
|----------|------|--------|---------|
| `savePrintPreviewPreferences()` | 5239 | — | Save font/lineHeight/columns/pages to Firebase |
| `loadPrintPreviewPreferences()` | 5284 | — | Restore saved layout on load |

---

## Window Exports (window.*)
```
window.styledPrompt(msg, default, title)   — Custom modal prompt
window.showSuccessToast(msg)               — Toast notification
window.normalizeKey(key)                   — Normalize key format
window.normalizeContent(content)           — Convert to clean format
window.processAITextResult(transcription)  — Direct AI text input
window.convertToInlineFormat(visual)       — Above-line → [C] inline
window.setBaselineChart(chart)             — Store baseline for transpose
window.setBaselineVisualContent(content)   — Store visual baseline
window.getBaselineChart()                  — Get baseline
window.getCurrentTransposeSteps()          — Get cumulative offset
window.setOriginalKey(key)                 — Set key before any transpose
window.transposeChart(source, shift)       — Main transpose fn
window.setDirectionalLayout(el, content)   — Apply RTL/LTR
window.formatForPreview(content, options)  — Render → HTML
window.makeChordsBold(content)             — Wrap chords in <b>
window.toggleFollowArrangement(state)      — Enable/disable arrangement reorder
window.isFollowArrangementEnabled()        — Check state
window.getDetectedLayout()                 — Get AI-detected layout (1/2)
window.openMusicModal/closeMusicModal/saveMusicLink/removeMusicLink/checkForMusicLinks
window.showSubscriptionModal()
window.showRegistrationPrompt()
window.updateSubscriptionModal()
window.loadPrintPreviewPreferences()
window.onLoadSongFromPlaylist(songId)      — Callback: load song from playlist
window.returnToLeaderSong()
window.refreshPreviewScaling()
window.currentSongName                     — Property via Object.defineProperty
window.pendingPlanAfterSignup              — Redirect to subscription after signup
```

## Key Event Listeners
| Element | Event | Handler |
|---------|-------|---------|
| `visualEditor` | `input` | `updateSongBookFromVisual()` + `updateLivePreview()` + `updateEditorBadges()` |
| `[data-shift]` buttons | `click` | `applyTranspose(shift)` |
| `resetTranspose` | `click` | Reset to originalDetectedKey |
| `keySelector` | `change` | Update "Key: X" in editor + currentKey |
| `nashvilleMode` | `change` | Update preview with Nashville numbers (Pro check) |
| `columnCountSelect` | `change` | `applyLayoutSettings()` + `autoFitContent()` |
| `fontSizeSlider` | `input` | `livePreview.style.fontSize` + pagination |
| `copyToClipboard` | `click` | Copy songbookOutput to clipboard |
| `reanalyzeButton` | `click` | POST lastUploadPayload + feedback → re-analyze |
| `proEditorToggle` | `change` | Toggle ChordPro ↔ above-line format |

## Nashville Number Logic
- `chordToNashville(chord, key)` — "C" + key "G Major" = "5"
- Only available for PRO tier: `subscriptionManager.canUseNashvilleNumbers()`
- Works for: chord mode, Nashville mode, Roman numeral mode, lyrics-only mode
- RTL special: reversed display "1 | C" instead of "C | 1"
