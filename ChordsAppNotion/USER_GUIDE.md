# ChordsApp User Guide

Welcome to ChordsApp - your AI-powered chord sheet digitizer. Transform any chord chart image or PDF into editable, transposable digital format.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Main Workflow](#main-workflow)
3. [Editor Features](#editor-features)
4. [Preview & Formatting](#preview--formatting)
5. [Song Library](#song-library)
6. [Account Features](#account-features)
7. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### What is ChordsApp?

ChordsApp uses AI to analyze images of chord sheets and convert them into editable digital format. Whether you have a photo of a worship song, a scanned chord chart, or a PDF, ChordsApp can transcribe it with chords, lyrics, and metadata.

### Supported File Formats

- **Images**: JPG, PNG, HEIC
- **Documents**: PDF (first page is analyzed)

### Requirements

- Modern web browser (Chrome, Safari, Firefox, Edge)
- Internet connection for AI analysis
- Account for saving songs (optional)

---

## Main Workflow

ChordsApp follows a simple 3-step workflow:

### Step 1: Upload

1. Click "Choose File" or the upload area
2. Select your chord sheet image or PDF
3. A preview of your file will appear

**Tip**: For best results, ensure the image is clear and well-lit with readable text.

### Step 2: Analyze

1. Click "Analyze with AI"
2. Wait 15-60 seconds for processing
3. The AI extracts:
   - Song title and artist
   - Key and BPM (if shown)
   - All chords and lyrics
   - Section markers (Verse, Chorus, Bridge, etc.)

**Status Indicators**:
- Gray dot = Ready
- Yellow dot = Processing
- Green dot = Success
- Red dot = Error

### Step 3: Edit & Export

1. Review the transcription in the Visual Editor
2. Make any corrections needed
3. Use the Live Preview to see formatted output
4. Print or copy the final result

---

## Editor Features

### Visual Editor

The Visual Editor shows your chord sheet in above-line format:

```
[Verse 1]
G        C        D
Amazing grace how sweet the sound
```

Edit directly by clicking in the text area. Changes sync automatically with the preview.

### Key Detection

After analysis, ChordsApp detects the song's key automatically. You can:
- View the detected key in the Key dropdown
- Manually select a different key (24 options: 12 major + 12 minor)
- See AI analysis comments about the key detection

### Transposition

Transpose your chord sheet to any key:

1. Use **+** and **-** buttons to transpose up/down by semitones
2. Or enter a specific number (-11 to +11) in the transpose field
3. Click "Reset" to return to the original key

All chords update instantly in both the editor and preview.

### Nashville Number System

Toggle Nashville Numbers to show chord functions instead of letter names:

- **OFF**: Shows chord letters (C, G, Am, F)
- **ON**: Shows numbers (1, 5, 6m, 4)

Nashville Numbers adapt to the current key, making it easy for musicians to play in any key.

### Metadata

Edit song information:

- **Title**: Song name (appears at top of preview)
- **Artist**: Performer/writer name
- **Key**: Musical key (auto-detected or manual)
- **BPM**: Tempo (40-240)
- **Capo**: Fret position for capo

### Section Markers

ChordsApp recognizes standard section markers:

- `[Intro]`
- `[Verse 1]`, `[Verse 2]`, etc.
- `[Pre-Chorus]`
- `[Chorus]`
- `[Bridge]`
- `[Outro]`
- `[Instrumental]`

Section badges appear in the preview showing the song structure at a glance.

---

## Preview & Formatting

### Live Preview

The Live Preview shows your chord sheet exactly as it will print:

- Real-time updates as you edit
- Professional formatting
- Bold chords for visibility
- Clean section headers

### Formatting Controls

Customize the appearance:

| Control | Range | Description |
|---------|-------|-------------|
| Font Size | 8-14pt | Adjust text size |
| Line Height | 1.0-2.0 | Control spacing between lines |
| Columns | 1-3 | Number of columns for layout |

### Printing

Click "Print" to open the browser print dialog. The preview is formatted for A4/Letter paper with:

- Clean white background
- Black text for readability
- Optimized margins
- Page break handling for long songs

### Copy to Clipboard

Click "Copy" to copy the SongBook format to your clipboard. This format is compatible with many music apps and can be pasted into:

- Text editors
- Other chord apps
- Email/messaging

---

## Song Library

Save your work and build a personal chord library.

### Saving Songs

1. Click "Save" in the editor
2. Enter a name for the song (auto-fills from title)
3. Click "Save Song"

Saved data includes:
- All chord and lyric content
- Current key and transpose state
- BPM and other metadata
- Timestamp

### Loading Songs

1. Click "Load" in the editor
2. Browse your saved songs
3. Click a song to load it

The song opens exactly as you saved it.

### Managing Your Library

**Search**: Type in the search box to filter songs by name

**Filter by Key**: Select one or more keys to show only songs in those keys

**Sort Options**:
- Date (newest first)
- Name (A-Z)
- BPM (high to low)
- Key (alphabetical)

**Delete**: Click the delete button on any song to remove it (confirmation required)

---

## Account Features

### Creating an Account

1. Click "Sign In" in the header
2. Choose "Create Account"
3. Enter email and password
4. Verify your email if required

### Signing In

**Email/Password**:
1. Enter your email
2. Enter your password
3. Click "Sign In"

**Google Sign-In**:
1. Click "Sign in with Google"
2. Select your Google account
3. Authorize access

### Account Benefits

- **Cloud Storage**: Songs save to your account, accessible anywhere
- **Sync**: Changes sync across devices
- **Security**: Your library is private and secure

### Subscription Tiers

Check your current plan by clicking your profile menu > "My Subscription"

| Feature | Free | Pro |
|---------|------|-----|
| AI analyses/day | Limited | Unlimited |
| Song library | Yes | Yes |
| All editing features | Yes | Yes |
| Priority processing | No | Yes |

---

## Tips & Best Practices

### Getting the Best AI Results

1. **Use clear images**: Well-lit, in-focus photos work best
2. **Avoid glare**: Minimize reflections on laminated sheets
3. **Crop tightly**: Remove unnecessary margins
4. **One page at a time**: For multi-page songs, analyze each page separately

### Re-Analyze with Feedback

If the AI makes mistakes:

1. Click "Re-analyze with feedback"
2. Describe what needs fixing (e.g., "The bridge chords are wrong" or "Align chords better with lyrics")
3. Submit for improved results

### Keyboard Shortcuts

- **Enter**: Submit forms/confirm dialogs
- **Escape**: Close modals

### RTL Language Support

ChordsApp supports right-to-left languages:

- Hebrew
- Arabic
- Other RTL scripts

Text direction adjusts automatically based on content.

### Troubleshooting

**Analysis fails**:
- Check your internet connection
- Try a clearer image
- Ensure the file isn't too large (under 10MB)

**Chords don't transpose correctly**:
- Verify the key is set correctly
- Check for unusual chord notations

**Preview looks wrong**:
- Adjust font size and line height
- Check column settings

**Can't save songs**:
- Make sure you're signed in
- Check your internet connection

---

## Support

Need help? Have feedback?

- **Issues**: Report problems on our GitHub
- **Feature requests**: We welcome suggestions
- **Donations**: Help support development

Thank you for using ChordsApp!
