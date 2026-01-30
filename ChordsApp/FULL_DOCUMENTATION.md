# aChordim - Complete Technical Documentation

**Version:** 1.0
**Website:** [www.thefaithsound.com](https://www.thefaithsound.com)
**Last Updated:** January 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Guide](#2-user-guide)
   - [Getting Started](#21-getting-started)
   - [Scanning Chord Charts](#22-scanning-chord-charts)
   - [Editing & Transposition](#23-editing--transposition)
   - [Display Modes](#24-display-modes)
   - [Print & Export](#25-print--export)
   - [Audio Features](#26-audio-features)
   - [Song Library](#27-song-library)
   - [Books & Collections](#28-books--collections)
   - [Live Sessions](#29-live-sessions)
   - [Live Mode](#210-live-mode)
   - [Subscription Tiers](#211-subscription-tiers)
3. [Developer Guide](#3-developer-guide)
   - [Architecture Overview](#31-architecture-overview)
   - [File Structure](#32-file-structure)
   - [Core Modules](#33-core-modules)
   - [ChordPro Parser](#34-chordpro-parser)
   - [Audio System](#35-audio-system)
   - [Session Management](#36-session-management)
   - [Authentication System](#37-authentication-system)
   - [Subscription System](#38-subscription-system)
4. [API Reference](#4-api-reference)
   - [Cloud Functions](#41-cloud-functions)
   - [Vercel Serverless API](#42-vercel-serverless-api)
   - [Firebase Database Schema](#43-firebase-database-schema)
5. [ChordPro Format Specification](#5-chordpro-format-specification)
6. [Deployment](#6-deployment)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Overview

**aChordim** is a comprehensive chord sheet management application for musicians and worship leaders. It leverages AI (Google Gemini) to scan and transcribe handwritten or printed chord charts, providing powerful tools for display, transposition, and live collaboration.

### Key Capabilities

- **AI-Powered OCR**: Scan chord charts from images (JPG, PNG, HEIC) or PDF files
- **Smart Transposition**: Transpose songs by semitones with automatic key detection
- **Multiple Display Modes**: Chords, Nashville Numbers, Both, or Lyrics Only
- **Live Sessions**: Real-time collaboration between leaders and band members
- **Audio Tools**: Built-in metronome and worship pads in all 12 keys
- **Multi-language Support**: English, Hebrew, Spanish, Portuguese, and more
- **RTL Support**: Full right-to-left text support for Hebrew/Arabic

### Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Backend | Firebase Cloud Functions (Node.js) |
| Database | Firebase Realtime Database |
| Authentication | Firebase Auth (Email/Password, Google, Anonymous) |
| AI/OCR | Google Gemini 3 Flash |
| Payments | PayPal SDK |
| PDF Rendering | PDF.js |
| Image Export | html2canvas |
| QR Codes | QRCode.js |
| Audio | Web Audio API |

---

## 2. User Guide

### 2.1 Getting Started

1. **Upload** a chord sheet image or PDF using the upload button
2. **Wait** for AI analysis (typically 3-10 seconds)
3. **Edit** the transcription in the visual editor if needed
4. **Transpose** to your preferred key using the key selector
5. **Adjust** layout settings (font size, columns, spacing)
6. **Print** or export as PNG image
7. **Save** to your library (requires Basic+ subscription)

### 2.2 Scanning Chord Charts

#### Supported Formats
- **Images**: JPG, PNG, HEIC
- **Documents**: PDF (multi-page supported)

#### Upload Methods
1. Click the upload area or drag-and-drop a file
2. Take a photo directly (mobile devices)

#### AI Analysis Options
- **Auto-Analyze**: Toggle to automatically analyze on upload
- **Intense Scan**: More thorough analysis for difficult charts (Pro only)
- **Re-analyze with Feedback**: Provide corrections for improved results

#### What the AI Detects
- Song title and number
- Key signature (with music theory analysis)
- Chord symbols and placement
- Lyrics in multiple languages
- Section markers (Verse, Chorus, Bridge, etc.)
- Layout direction (LTR/RTL)
- 1-column vs 2-column layout

### 2.3 Editing & Transposition

#### Visual Editor
The visual editor uses ChordPro format with inline chord brackets:
```
[G]Amazing [C]grace how [D]sweet the [G]sound
```

#### Transposition
- Use **+/-** buttons to transpose by semitones
- Click **key buttons** (C through B) for quick transposition
- **Original baseline** is preserved for accurate re-transposition
- Handles bass notes correctly (C/G → D/A when transposing +2)

#### Key Detection
The app automatically detects keys using music theory analysis:
- Major key patterns: I, ii, iii, IV, V, vi, vii°
- Minor key patterns: i, ii°, bIII, iv, v, bVI, bVII
- Analysis considers chord frequency, starting/ending chords, and progressions

### 2.4 Display Modes

| Mode | Description | Example |
|------|-------------|---------|
| **Chords** | Standard chord symbols | C, Am, G7, F#m |
| **Nashville** | Number system based on key | 1, 4, 5, 6m |
| **Both** | Combined display | C\|1, G\|5, Am\|6m |
| **Lyrics Only** | Hide all chords | (No chords shown) |

**Nashville Numbers** require Pro or Book subscription.

### 2.5 Print & Export

#### Print Settings
- **Font Size**: 8-28pt
- **Line Spacing**: 1.0-2.0
- **Character Spacing**: 0-8px
- **Columns**: 1, 2, 3, or 4
- **Auto-fit**: Target 1-4 pages automatically

#### Export Options
- **Print**: Opens browser print dialog (save as PDF)
- **Save as PNG**: Creates downloadable image file

#### A4 Preview
- Real-time preview with page indicators
- Mobile-responsive scaling
- Accurate print representation

### 2.6 Audio Features

#### Metronome

| Setting | Range | Description |
|---------|-------|-------------|
| BPM | 20-300 | Beats per minute |
| Time Signature | 4/4, 3/4, 6/8, 2/4, 5/4, 7/8, 12/8 | Beats per measure |
| Sound Type | Click, Beep, Wood | Click sound style |
| Multiplier | x0.5, x1, x2 | Speed multiplier |
| Accent | On/Off | Accent first beat |
| Volume | 0-100% | Master volume |

**Tap Tempo**: Tap the button repeatedly to set BPM from your rhythm.

#### Worship Pads

Looping ambient pad sounds available in all 12 keys (C through B including sharps).

**Audio Effects Chain:**
1. **Low-pass Filter**: 20Hz - 20kHz (removes highs)
2. **High-pass Filter**: 20Hz - 2kHz (removes lows)
3. **Reverb**: 0-100% wet/dry mix with impulse response
4. **Stereo Panner**: Left to Right positioning
5. **Master Volume**: Overall output level

**Features:**
- Smooth 4-6 second crossfade between keys
- Stop All with gradual fade-out
- Preloaded from CDN for instant playback

### 2.7 Song Library

#### Saving Songs
Songs are saved with comprehensive metadata:
- Title and author
- Key, BPM, time signature
- Original baseline chart (for accurate transposition)
- Current transpose state
- Layout preferences (font, columns, etc.)
- Timestamps

#### Loading Songs
- Search and filter by title/author
- Sort by date or name
- Quick metadata badges (Key, BPM, Time)
- Per-song layout settings restored on load

#### Bulk Operations
- **Bulk Import**: Import multiple .txt, .cho, .chordpro files
- **Bulk Select**: Select multiple songs for batch operations
- **Bulk Delete**: Delete multiple songs at once
- **Add to Session**: Add multiple songs to a session playlist

### 2.8 Books & Collections

Organize songs into custom collections:

- **Create Books**: Name your collections (e.g., "Sunday Worship", "Christmas Set")
- **Add Songs**: Add individual or multiple songs to books
- **Filter by Book**: View only songs in a specific book
- **Public Songs**: Access globally shared songs from other users

#### Public Songs
- Toggle any song as public to share with everyone
- Public songs appear in the "Public Songs" filter
- Shareable public link: `?public=SONG_ID`

### 2.9 Live Sessions

Real-time collaboration for worship teams.

#### Roles

| Role | Capabilities |
|------|-------------|
| **Leader** (Pro) | Create sessions, control song selection, push to all players |
| **Player** (Basic+) | Follow leader's selections in real-time |
| **Singer** | Anonymous lyrics-only view with limited controls |

#### Session Features
- **6-character session code** format: `A3F-7K2`
- **QR code generation** for easy joining
- **Real-time sync** via Firebase Realtime Database
- **Playlist management** within sessions
- **"Now Playing" banner** shows current song
- **"Return to Leader" button** to re-sync
- **Session history** saved to user profile

#### Creating a Session (Pro)
1. Click "Create Session" in the Sessions panel
2. Enter a session title
3. Share the code or QR with band members
4. Add songs to the playlist from your library

#### Managing the Playlist
- **Add Songs**:
  - **Single Song**: Open a song and click "Add to Session" in the session panel.
  - **Bulk Add**: Select multiple songs in the library and clicks "Add to Session".
- **Reorder**: Use Up/Down arrows in the playlist view to change song order.
- **Edit/Delete**: Rename or remove songs from the playlist using the edit (pencil) and delete (trash) icons.

#### Broadcasting Songs
- **From Playlist**: Click any song in the session playlist (in Live Mode sidebar or Session Manager) to instantly broadcast it to all connected players.
- **From Editor**: Loading a new song in the editor while in a session automatically broadcasts it if you are the leader.

#### Joining a Session
1. Enter the 6-character code in "Join Session"
2. Or scan the QR code
3. Follow the leader's song selections automatically
4. Toggle "Follow Leader" to work independently

#### Singer Mode
Join via special URL: `?singer=SESSION_CODE`
- Anonymous authentication
- Lyrics-only display (no chords)
- Simplified controls
- Auto-follows leader's songs

### 2.10 Live Mode

Full-screen distraction-free performance view.

#### Controls
- **Top Bar**: Song name, key display, exit button
- **Bottom Bar**: Display mode, transpose, layout, zoom, playlist
- **Auto-hide**: Controls fade after 3 seconds of inactivity
- **Tap to show**: Tap anywhere to reveal controls

#### Display Options
- Column layout (1 or 2 columns)
- Font size zoom
- Badges visibility toggle
- Section borders toggle
- Full Overview mode

#### Section Highlighting
Leaders can click on section blocks to highlight them for all players in the session.

#### MIDI Controller Support
Control Live Mode with external MIDI devices:
- Next/Previous song navigation
- Transpose up/down
- Other mappable controls

### 2.11 Subscription Tiers

| Feature | Free | Basic ($0.99/mo) | Pro ($1.99/mo) | Book ($9.99 once) |
|---------|:----:|:----------------:|:--------------:|:-----------------:|
| Scans/month | 3 | 20 | 50 | 20 + packs |
| Transpose | Yes | Yes | Yes | Yes |
| Print/Export | Yes | Yes | Yes | Yes |
| Save to Library | No | Yes | Yes | Yes |
| Nashville Numbers | No | No | Yes | Yes |
| Create Sessions | No | No | Yes | No |
| Join Sessions | No | Yes | Yes | No |
| Intense Scan | No | No | Yes | No |
| Metronome | Yes | Yes | Yes | Yes |
| Worship Pads | Yes | Yes | Yes | Yes |

#### Scan Packs (Book Tier)
- **Starter Pack**: 5 scans - $0.99
- **Value Pack**: 15 scans - $1.99
- **Bundle Pack**: 50 scans - $4.99

---

## 3. Developer Guide

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  app.js          │ Main application logic, event handling       │
│  chordpro-parser │ Chord parsing, transposition, formatting     │
│  live-mode.js    │ Full-screen performance view                 │
│  session-*.js    │ Live session management and UI               │
│  auth.js         │ Firebase authentication                      │
│  subscription.js │ Tier management, usage tracking              │
│  song-library.js │ Save/load/manage songs                       │
│  metronome.js    │ Audio metronome (Web Audio API)              │
│  pad-player.js   │ Worship pads (Web Audio API)                 │
├─────────────────────────────────────────────────────────────────┤
│                     Firebase Services                            │
├─────────────────────────────────────────────────────────────────┤
│  Realtime Database │ User data, songs, sessions, subscriptions  │
│  Authentication    │ Email/password, Google OAuth, Anonymous    │
│  Cloud Functions   │ Server-side APIs, admin operations         │
├─────────────────────────────────────────────────────────────────┤
│                     External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  Google Gemini     │ AI-powered chord chart OCR                 │
│  PayPal SDK        │ Subscription payments                      │
│  jsDelivr CDN      │ Pad audio files                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 File Structure

```
ChordsApp/
├── index.html              # Main HTML with all UI elements
├── app.js                  # Main application logic (~6000+ lines)
├── chordpro-parser.js      # Chord format v4 parser
├── live-mode.js            # Live performance mode
├── session-manager.js      # Session state management
├── session-ui.js           # Session UI components
├── auth.js                 # Firebase authentication
├── subscription.js         # Subscription management
├── song-library.js         # Library operations
├── metronome.js            # Metronome audio engine
├── pad-player.js           # Worship pads audio system
├── paypal-subscription.js  # PayPal integration
├── theme.js                # Dark/light theme toggle
├── firebase-config.js      # Firebase configuration
├── midi-controller.js      # MIDI device support
├── styles.css              # Main stylesheet
├── pads/                   # Worship pad audio files (C.mp3 - B.mp3)
├── api/
│   └── analyze-chart.js    # Vercel serverless function (Claude)
├── functions/
│   └── index.js            # Firebase Cloud Functions
└── documentation.md        # Brief documentation
```

### 3.3 Core Modules

#### app.js - Main Application

**Key Functions:**
- `analyzeChartWithGemini()` - Sends image to Gemini API for OCR
- `transposeChart()` - Transposes all chords by semitones
- `formatForPreview()` - Converts ChordPro to HTML preview
- `makeChordsBold()` - Applies display mode (Nashville, Both, Lyrics)
- `normalizeKey()` - Standardizes key format (e.g., "Gm" → "G Minor")

**Global State:**
```javascript
window.currentTransposeSteps  // Current transpose offset
window.currentSongName        // Active song name
window.currentSongId          // Active song Firebase ID
window.baselineChart          // Original untransposed chart
```

**Custom Events:**
```javascript
// Fired when a song is loaded from library
window.dispatchEvent(new CustomEvent('songLoaded', {
    detail: {
        baselineChart: '...',
        originalKey: 'G Major',
        bpm: 120,
        timeSignature: '4/4'
    }
}));
```

#### Mobile Optimizations

The app includes comprehensive mobile support:
- Pinch-to-zoom disabled (custom zoom controls instead)
- Double-tap zoom prevented
- A4 preview scaling for small screens
- Touch-friendly control sizing
- Collapsible side menu

### 3.4 ChordPro Parser

**Location:** `chordpro-parser.js`

The parser handles ChordPro format v4 with custom extensions.

#### Regex Patterns

```javascript
// Chord in brackets: [G], [Am7], [F#m], [C/G]
CHORD_REGEX: /\[([A-G][#b]?(?:maj|ma|min|m|M|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g

// Directives: {title: value}, {key: G}
DIRECTIVE_REGEX: /\{(\w+):\s*([^}]*)\}/g

// Section markers: {c: Verse 1:}
SECTION_REGEX: /\{c:\s*([^}]+)\}/g

// Arrangement badges: (I) (V1) (PC) (C) (B)
BADGE_LINE_REGEX: /^[\s]*((\([A-Z]+\d*\)(\d+x)?\s*)|>\s*)+[\s]*$/i
```

#### Key Functions

```javascript
// Parse all directives from content
parseDirectives(content) → { title, key, tempo, time, ... }

// Parse arrangement badges with repeat counts
parseArrangementFull(content) → [{ type: 'badge', label: 'V1', repeat: 2 }, ...]

// Transpose a single chord
transposeChord(chord, semitones, useFlats) → string

// Transpose entire content including key directive
transposeContent(content, semitones, useFlats) → string

// Extract metadata for display
extractMetadata(content) → { title, artist, key, tempo, time, capo }
```

#### Note Arrays

```javascript
NOTES: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
NOTES_FLAT: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
```

### 3.5 Audio System

#### Metronome (metronome.js)

**Web Audio API Architecture:**
```
Oscillator → GainNode → MasterGain → AudioContext.destination
```

**Key Properties:**
```javascript
metronome.bpm           // Current BPM (20-300)
metronome.beatsPerMeasure // Time signature numerator
metronome.beatUnit      // Time signature denominator
metronome.volume        // 0-1 volume level
metronome.soundType     // 'click', 'beep', 'wood'
metronome.multiplier    // 0.5, 1, or 2 (speed)
metronome.isPlaying     // Current state
```

**Key Methods:**
```javascript
metronome.start()           // Start playback
metronome.stop()            // Stop playback
metronome.toggle()          // Toggle play/stop
metronome.setBpm(value)     // Set BPM
metronome.tap()             // Tap tempo input
metronome.setTimeSignature(beats, unit)
metronome.setMultiplier(value)  // Set speed multiplier
```

#### Pad Player (pad-player.js)

**Audio Effects Chain:**
```
Source → GainNode → LowPass → HighPass → [Dry + Convolver] → Panner → Master → Destination
```

**Key Properties:**
```javascript
padPlayer.keys          // ['C', 'Csharp', 'D', ...] all 12 keys
padPlayer.volume        // Master volume 0-1
padPlayer.crossfade     // Fade duration (4-8 seconds)
padPlayer.lowPassFreq   // Low-pass cutoff (20-20000 Hz)
padPlayer.highPassFreq  // High-pass cutoff (20-2000 Hz)
padPlayer.reverbMix     // Reverb wet/dry (0-1)
padPlayer.pan           // Stereo pan (-1 to 1)
```

**Key Methods:**
```javascript
padPlayer.preloadFiles(onProgress)  // Preload from CDN (no user interaction needed)
padPlayer.loadSounds(onProgress)    // Decode audio (requires user interaction)
padPlayer.play(key)                 // Play with crossfade from current
padPlayer.stop(key)                 // Stop with fade-out
padPlayer.stopAll()                 // Stop all with slow fade
padPlayer.toggle(key)               // Toggle play/stop
padPlayer.setVolume(0-1)
padPlayer.setLowPass(0-1)           // Mapped to frequency range
padPlayer.setHighPass(0-1)
padPlayer.setReverb(0-1)
padPlayer.setPan(-1 to 1)
```

### 3.6 Session Management

#### SessionManager Class (session-manager.js)

**State:**
```javascript
sessionManager.currentUser      // Firebase user object
sessionManager.activeSession    // Current session ID
sessionManager.isLeader         // Is current user the leader
sessionManager.isSinger         // Is singer (anonymous) mode
sessionManager.inLiveMode       // Following leader updates
sessionManager.localTransposeMap // Per-song transpose overrides
sessionManager.leaderCurrentSong // Cached leader's song
```

**Key Methods:**
```javascript
// Session Lifecycle
sessionManager.createSession(title)      // Create new (PRO only)
sessionManager.joinSession(sessionCode)  // Join by code
sessionManager.joinAsSinger(sessionCode) // Join anonymously
sessionManager.leaveSession()            // Leave current
sessionManager.endSession()              // End session (leader only)

// Song Control (Leader)
sessionManager.updateCurrentSong(songData)     // Broadcast song
sessionManager.addSongToPlaylist(songData)     // Add to playlist
sessionManager.removeSongFromPlaylist(songId)  // Remove from playlist
sessionManager.updateSelectedSection(sectionId, sectionName)

// Player Control
sessionManager.toggleLiveMode()           // Toggle follow mode
sessionManager.setLocalTranspose(songId, steps)

// Data Access
sessionManager.getParticipants()          // Get connected users
sessionManager.getPlaylist()              // Get session playlist
sessionManager.getUserSessions()          // Get saved sessions
```

**Callbacks (Override in app.js):**
```javascript
sessionManager.onSongUpdate(songData, shouldDisplay)
sessionManager.onPlaylistUpdate(playlist)
sessionManager.onParticipantsUpdate(participants)
sessionManager.onSectionSelected(sectionId, sectionName)
```

### 3.7 Authentication System

#### ChordsAuthManager Class (auth.js)

**Single-Device Login:**
- Each user has configurable max sessions (default: 1)
- New login kicks out oldest session
- Session validated via Firebase listener
- Kicked users see notification and are logged out

**Methods:**
```javascript
chordsAuth.signUp(email, password, displayName)
chordsAuth.signIn(email, password)
chordsAuth.signInWithGoogle()
chordsAuth.signOut()
chordsAuth.resetPassword(email)
chordsAuth.isAuthenticated()
chordsAuth.getCurrentUser()
```

**Session Management:**
```javascript
// Firebase structure: users/{uid}/activeSessions/{pushId}
{
    sessionId: "unique_session_id",
    timestamp: ServerValue.TIMESTAMP,
    userAgent: "browser info..."
}
```

### 3.8 Subscription System

#### SubscriptionManager Class (subscription.js)

**Tier Configuration:**
```javascript
SUBSCRIPTION_TIERS = {
    FREE: {
        name: 'Free',
        price: 0,
        analysesPerMonth: 3,
        canSave: false,
        nashvilleNumbers: false,
        canCreateSession: false,
        canJoinSession: false
    },
    BASIC: {
        analysesPerMonth: 20,
        canSave: true,
        canJoinSession: true
        // ...
    },
    PRO: {
        analysesPerMonth: 50,
        nashvilleNumbers: true,
        canCreateSession: true,
        canJoinSession: true
        // ...
    },
    BOOK: {
        isOneTime: true,
        initialScans: 20,
        canSave: true,
        nashvilleNumbers: true
        // ...
    }
}
```

**Key Methods:**
```javascript
subscriptionManager.init(user)
subscriptionManager.getCurrentTier()       // 'FREE', 'BASIC', 'PRO', 'BOOK'
subscriptionManager.canAnalyze()           // Check scan quota
subscriptionManager.canSaveSongs()         // Check save permission
subscriptionManager.canUseNashvilleNumbers()
subscriptionManager.canCreateSession()
subscriptionManager.canJoinSession()
subscriptionManager.getRemainingAnalyses() // Scans left this month
subscriptionManager.getUsageSummary()      // Full status object
subscriptionManager.incrementAnalysisCount() // Called after scan (server-side)
```

---

## 4. API Reference

### 4.1 Cloud Functions

**Base URL:** `https://us-central1-chordsapp-e10e7.cloudfunctions.net/`

#### analyzeChartGemini (POST)
AI-powered chord chart OCR using Google Gemini.

**Request:**
```javascript
{
    imageData: "base64_encoded_image",
    mimeType: "image/jpeg",        // or image/png, application/pdf
    feedback: "optional correction text",
    previousTranscription: "previous result for refinement",
    intenseMode: false             // Pro users only
}
```

**Response:**
```javascript
{
    success: true,
    transcription: "Title: Song Name\nKey: G Major\n\n[G]Lyrics with [C]chords...",
    metadata: {
        model: "gemini-2.0-flash-exp",
        feedbackApplied: false
    }
}
```

#### canAnalyze (POST)
Check if user can perform analysis (quota check).

**Headers:** `Authorization: Bearer {firebase_id_token}`

**Response:**
```javascript
{
    canAnalyze: true,
    remaining: 15,
    tier: "BASIC",
    hasBonus: false
}
```

#### incrementAnalysis (POST)
Increment user's analysis count after successful scan.

**Headers:** `Authorization: Bearer {firebase_id_token}`

**Response:**
```javascript
{
    success: true,
    analysesThisMonth: 5,
    usedBonus: false
}
```

#### Admin Functions (Require Admin UID)

| Function | Description |
|----------|-------------|
| `listAllUsers` | Get all users with subscription info |
| `giveBonusAnalyses` | Grant bonus scans to user |
| `upgradeUser` | Change user subscription tier |
| `removeUser` | Delete user account |
| `resetPassword` | Admin password reset |
| `setMaxDevices` | Configure device limit |
| `orphanUsers` | Find orphaned accounts |
| `deleteOrphanUser` | Clean up orphan accounts |
| `userStats` | Get usage statistics |

### 4.2 Vercel Serverless API

**File:** `api/analyze-chart.js`

Alternative OCR endpoint using Anthropic Claude (for backup/testing).

**Endpoint:** `/api/analyze-chart`

**Environment Variables:**
- `ANTHROPIC_API_KEY`: Anthropic API key
- `ANTHROPIC_MODEL`: Model ID (default: `claude-3-5-haiku-20241022`)

### 4.3 Firebase Database Schema

```
/users/{uid}/
    /subscription/
        tier: "FREE" | "BASIC" | "PRO" | "BOOK"
        status: "active" | "canceled"
        startDate: ISO8601
        paypalSubscriptionId: string | null
        endDate: ISO8601 | null

    /usage/
        analysesThisMonth: number
        monthStartDate: ISO8601

    /purchasedScans: number  // For BOOK tier
    /bonusAnalyses: number   // Admin-granted bonus
    /maxSessions: number     // Device limit (default: 1)

    /activeSessions/{pushId}/
        sessionId: string
        timestamp: ServerTimestamp
        userAgent: string

    /songs/{songId}/
        name: string              // Legacy display name
        title: string             // Structured title
        author: string
        key: string               // Current key
        bpm: number
        timeSignature: string
        content: string           // Current (possibly transposed) content
        baselineChart: string     // Original untransposed chart
        transposeSteps: number
        originalKey: string
        fontSize: number
        lineHeight: number
        charSpacing: number
        columnCount: string
        pageCount: string
        isPublic: boolean
        createdAt: ServerTimestamp
        updatedAt: ServerTimestamp

    /books/{bookId}/
        name: string
        songIds: string[]
        createdAt: ServerTimestamp
        updatedAt: ServerTimestamp

    /sessions/{sessionId}/
        (session reference)

    /liveModePreferences/
        columnLayout: number
        fontSize: number
        displayMode: string
        showBadges: boolean
        showBorders: boolean
        autoHidePlaylist: boolean

        /songPreferences/{songId}/
            fontSize: number
            columns: number
            transposeSteps: number
            showBorders: boolean

/sessions/{sessionId}/
    /metadata/
        title: string
        leaderId: string
        leaderName: string
        sessionCode: string       // e.g., "A3F-7K2"
        createdAt: ServerTimestamp
        status: "active" | "ended"
        allowSingers: boolean

    /currentSong/
        songId: string
        name: string
        title: string
        author: string
        key: string
        bpm: number
        timeSignature: string
        content: string
        originalKey: string
        transposeSteps: number
        updatedAt: ServerTimestamp

    /playlist/{songId}/
        name: string
        title: string
        author: string
        key: string
        bpm: number
        content: string
        originalKey: string
        addedAt: ServerTimestamp
        order: number

    /participants/{uid}/
        name: string
        tier: string
        type: "player" | "singer"
        joinedAt: ServerTimestamp
        status: "connected" | "disconnected"

    /selectedSection/
        sectionId: string
        sectionName: string
        timestamp: ServerTimestamp

/public-songs/{songId}/
    title: string
    author: string
    content: string
    baselineChart: string
    key: string
    bpm: string
    timeSignature: string
    fontSize: number
    lineHeight: number
    columnCount: string
    ownerUid: string
    publishedAt: ServerTimestamp
```

---

## 5. ChordPro Format Specification

aChordim uses ChordPro format v4 with custom extensions.

### Metadata Directives

```chordpro
{title: Amazing Grace}
{subtitle: John Newton}
{artist: Traditional}
{key: G Major}
{tempo: 72}
{time: 3/4}
{capo: 2}
{layout: 2}           # Column hint (1 or 2)
```

### Section Markers

```chordpro
{c: Intro:}
{c: Verse 1:}
{c: Pre-Chorus:}
{c: Chorus:}
{c: Bridge:}
{c: Outro:}
{c: Interlude:}
{c: Tag:}
```

Or clean format (auto-detected):
```
Intro:
Verse 1:
Chorus:
```

### Inline Chords

```chordpro
[G]Amazing [C]grace how [D]sweet the [G]sound
That [G]saved a [C]wretch like [D]me
```

### Chord Grids (Instrumental)

```chordpro
| G . D/F# | Em7 . . | C . G/B | D . . |
```

### Arrangement Badges

Single line at top of song showing structure:

```chordpro
(I) (V1) (PC) (C) (V2) (PC) (C) (B) (C) (TAG) (O)
```

With repeat counts:
```chordpro
(I) (V1) (C)2x (V2) (C)2x (B) (C) (O)
```

**Badge Codes:**
| Code | Meaning |
|------|---------|
| (I) | Intro |
| (V), (V1), (V2) | Verse |
| (PC) | Pre-Chorus |
| (C) | Chorus |
| (B) | Bridge |
| (O) | Outro |
| (INT) | Interlude |
| (TAG) | Tag |
| (TURN) | Turnaround |
| (BRK) | Break |

---

## 6. Deployment

### Firebase Hosting

```bash
cd ChordsApp
firebase deploy
```

### Firebase Functions

```bash
cd ChordsApp/functions
npm install
firebase deploy --only functions
```

### Environment Variables (Functions)

Set via Firebase CLI:
```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
firebase functions:config:set admin.uids="uid1,uid2"
```

### Vercel (Alternative API)

```bash
cd ChordsApp
vercel --prod
```

Required environment variables in Vercel dashboard:
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (optional)

---

## 7. Troubleshooting

### Common Issues

#### "Session not found" when joining
- Check session code format (A3F-7K2)
- Ensure session is still active (not ended)
- Leader must have created session recently

#### Songs not transposing correctly
- Ensure song has a baseline chart saved
- UPDATE the song after any edits to save new baseline
- Check that key selector matches the original key

#### Pads not playing
- Click anywhere first (browser requires user interaction)
- Check volume controls (master and pad)
- Verify audio files loaded (check console)

#### Analysis fails or times out
- Check file size (max ~10MB)
- Ensure image is clear and well-lit
- Try Intense Scan mode (Pro)
- Check remaining scan quota

#### Nashville numbers show wrong
- Verify the key selector matches the song's actual key
- Nashville Numbers require Pro/Book subscription
- Check display mode is set to "Nashville" or "Both"

### Debug Tools

```javascript
// Check subscription status
console.log(window.subscriptionManager.getUsageSummary());

// Check session state
console.log({
    active: window.sessionManager.activeSession,
    isLeader: window.sessionManager.isLeader,
    inLiveMode: window.sessionManager.inLiveMode
});

// Check current song state
console.log({
    name: window.currentSongName,
    id: window.currentSongId,
    transpose: window.currentTransposeSteps
});

// Migrate old songs to new format
window.migrateSongDatabase();

// Clean library songs (remove old ChordPro tags)
window.cleanLibrarySongs();
```

### Browser Console Commands

```javascript
// Force refresh pads
window.padPlayer.loadSounds();

// Reset metronome
window.metronome.stop();
window.metronome.setBpm(120);

// Clear session state
window.sessionManager.cleanup();

// Force exit live mode
window.liveMode.exit();
```

---

## Support

For issues or feedback:
- GitHub: [github.com/ori-code/ori-code.github.io](https://github.com/ori-code/ori-code.github.io)
- Website: [www.thefaithsound.com](https://www.thefaithsound.com)

---

*Documentation for aChordim v1.0*
*© 2025-2026 The Faith Sound*
