# aChordim - Complete App Documentation

## Overview
**aChordim** is a comprehensive chord sheet management app for musicians and worship leaders. It uses AI to scan handwritten or printed chord charts and provides powerful tools for display, transposition, and live collaboration.

**Website**: [www.thefaithsound.com](https://www.thefaithsound.com)

---

## Core Features

### 1. Chord Sheet Scanning (AI-Powered)
- **Upload formats**: JPG, PNG, HEIC, PDF
- **AI Model**: Gemini 3 Flash
- **Auto-analysis** on upload (toggle)
- **Intense Scan** mode for difficult charts (Pro only)
- **Re-analysis** with user feedback for refinement
- **Multi-language**: English, Hebrew, Spanish, Portuguese + more
- **Layout detection**: 1-column vs 2-column automatic detection

### 2. Display Modes
| Mode | Description |
|------|-------------|
| **Chords** | Standard chord symbols (C, Am, G7) |
| **Nashville** | Number system (1, 4, 5) |
| **Both** | Chord + Nashville (C\|1, G\|5) |
| **Lyrics Only** | Hide all chords |

### 3. Transposition
- Transpose by semitones (-11 to +11)
- Quick key buttons (C through B)
- Preserves chord quality (maj, min, sus, etc.)
- Handles bass notes (C/G → D/A)
- Auto-updates detected key

### 4. Print & Export
- **A4 Preview** with page indicator
- **Font size**: 8-28pt
- **Line spacing**: 1.0-2.0
- **Character spacing**: 0-8px
- **Columns**: 1, 2, 3, or 4
- **Auto-fit** to target page count (1-4 pages)
- **Save as PNG** image
- **Print** to PDF via browser

---

## Audio Features

### 5. Metronome
- BPM range: 20-300
- Time signatures: 4/4, 3/4, 6/8, 2/4, 5/4, 7/8, 12/8
- Sound types: click, beep, wood
- **Speed multiplier**: x0.5 (half), x1 (normal), x2 (double)
- **Tap tempo** for quick BPM setting
- Accent on beat 1 (toggle)
- Volume control
- Beat indicator display

### 6. Worship Pads
- **12 keys** available (C through B including sharps)
- Looping ambient background pads
- **Audio effects chain**:
  - Low-pass filter (20Hz-20kHz)
  - High-pass filter (20Hz-20kHz)
  - Reverb with impulse response (0-100%)
  - Stereo panner (left-right)
  - Master volume control
- Smooth crossfade between key changes (4-6 seconds)
- Stop All with smooth fade-out

---

## Library & Organization

### 7. Song Library
- Save songs to Firebase cloud
- Load/update/delete songs
- **Bulk import** (.txt, .cho, .chordpro, .chopro files)
- Search and filter functionality
- Per-song preferences storage:
  - Font size
  - Column layout
  - Transpose settings
  - Border visibility

### 8. Books (Collections)
- Create personal song collections
- Organize songs into multiple books
- Rename and delete books
- Filter songs by book
- Public Songs collection (globally shared)

---

## Live Sessions

### 9. Session Features
| Role | Capabilities |
|------|-------------|
| **Leader** | Control song selection, push updates to all players |
| **Player** | Follow leader's song selections in real-time |
| **Singer** | Lyrics-only anonymous mode |

- **Session code**: 6-character format (e.g., A3F-7K2)
- **QR code** generation for easy joining
- **Real-time sync** via Firebase Realtime Database
- **Playlist** management within sessions
- **"Now Playing"** banner shows current song
- **"Return to Leader"** button to re-sync
- **Session history** saved to user profile

---

## Subscription Tiers

| Feature | Free | Basic | Pro | Book |
|---------|:----:|:-----:|:---:|:----:|
| **Price** | $0 | $0.99/mo | $1.99/mo | $9.99 once |
| Scans/month | 3 | 20 | 50 | 20 + packs |
| Transpose | ✓ | ✓ | ✓ | ✓ |
| Print/Export | ✓ | ✓ | ✓ | ✓ |
| Save to Library | ✗ | ✓ | ✓ | ✓ |
| Nashville Numbers | ✗ | ✗ | ✓ | ✓ |
| Create Sessions | ✗ | ✗ | ✓ | ✗ |
| Join Sessions | ✗ | ✓ | ✓ | ✗ |
| Intense Scan | ✗ | ✗ | ✓ | ✗ |
| Metronome | ✓ | ✓ | ✓ | ✓ |
| Worship Pads | ✓ | ✓ | ✓ | ✓ |

### Scan Packs (Book Tier)
- 5 scans: $0.99
- 15 scans: $1.99
- 50 scans: $4.99

---

## UI & Themes

### 10. Theme Support
- **Dark Mode** (default) - Professional dark interface
- **Light Mode** - Bright, readable alternative
- Theme persists in localStorage
- Smooth transitions (0.3s animation)

### 11. Responsive Design
- Mobile-friendly layout
- Tablet optimized
- Desktop full-featured
- Collapsible side menu
- Touch-friendly controls

### 12. RTL (Right-to-Left) Support
- Hebrew/Arabic text detection
- Automatic directional layout
- Proper chord placement with RTL text
- Mixed LTR/RTL content handling
- Hebrew section markers support

---

## ChordPro Format v4

### Metadata Directives
```
{title: Song Title}
{subtitle: Artist/Composer}
{key: G}
{time: 4/4}
{tempo: 120}
{layout: 2}
```

### Section Markers
```
{c: Intro:}
{c: Verse 1:}
{c: Pre-Chorus:}
{c: Chorus:}
{c: Bridge:}
{c: Outro:}
```

### Arrangement Badges
```
(I) (V1) (PC) (C) (V2) (PC) (C) (B) (C) (TAG) (O)
```

Badge codes:
- `(I)` = Intro, `(O)` = Outro
- `(V)`, `(V1)`, `(V2)` = Verse
- `(PC)` = Pre-Chorus
- `(C)` = Chorus
- `(B)` = Bridge
- `(INT)` = Interlude
- `(TAG)` = Tag
- `(TURN)` = Turnaround
- `(BRK)` = Break

### Chord Notation
```
[G]Amazing [C]grace how [D]sweet the [G]sound
```

### Chord Grids (Instrumental)
```
| G . Dsus | Em7 | C | G/B |
```

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Backend | Firebase Cloud Functions (Node.js) |
| Database | Firebase Realtime Database |
| Authentication | Firebase Auth (Email/Password, Anonymous) |
| AI/OCR | Google Gemini 3 Flash |
| Payments | PayPal SDK |
| PDF Rendering | PDF.js |
| Image Export | html2canvas |
| QR Codes | QRCode.js |
| Audio | Web Audio API |

---

## Key Files

| File | Purpose |
|------|---------|
| `app.js` | Main application logic |
| `chordpro-parser.js` | Chord format v4 parser |
| `metronome.js` | Metronome audio engine |
| `pad-player.js` | Worship pads audio system |
| `song-library.js` | Library management |
| `session-manager.js` | Live session logic |
| `session-ui.js` | Session UI components |
| `auth.js` | Firebase authentication |
| `subscription.js` | Tier/usage management |
| `paypal-subscription.js` | PayPal integration |
| `theme.js` | Dark/light theme toggle |
| `live-mode.js` | Live performance mode |
| `functions/index.js` | Backend cloud functions |
| `api/analyze-chart.js` | Vercel serverless API (alternative) |

---

## Admin Features (Backend)

### Cloud Functions Endpoints
- `analyzeChart` - Claude OCR endpoint
- `analyzeChartGemini` - Gemini OCR endpoint (active)
- `canAnalyze` - Check user scan permissions
- `incrementAnalysis` - Track usage after scan
- `listAllUsers` - Admin user management
- `giveBonusAnalyses` - Grant bonus scans
- `upgradeUser` - Change subscription tier
- `removeUser` - Delete user account
- `resetPassword` - Admin password reset
- `setMaxDevices` - Configure device limits
- `orphanUsers` - Find orphaned accounts
- `deleteOrphanUser` - Clean up orphans
- `userStats` - Get user statistics

---

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Getting Started

1. **Upload** a chord sheet image or PDF
2. **Wait** for AI analysis (3-10 seconds)
3. **Edit** the transcription if needed
4. **Transpose** to your preferred key
5. **Adjust** layout (columns, font size)
6. **Print** or save as image
7. **Save** to library for future use (Basic+ tiers)

---

## Support

For issues or feedback, visit: [github.com/ori-code/ori-code.github.io](https://github.com/ori-code/ori-code.github.io)

---

*Documentation generated for aChordim v1.0*
*© 2025 The Faith Sound*
