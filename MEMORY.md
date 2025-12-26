# MEMORY.md - Claude Context for ori-code.github.io

## Project Overview
- **Site**: www.thefaithsound.com (GitHub Pages)
- **Repository**: ori-code.github.io
- **Purpose**: Music/worship resources website with chord sheet application

## Main Application: ChordsApp
- **Location**: `/ChordsApp/`
- **Description**: Chord sheet and song management application
- **Features**:
  - Song library management
  - Live performance mode
  - Session management (multi-user)
  - Transpose functionality
  - Dark theme support
  - Section editor with dropdowns

## Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js with Express (server.js)
- **Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth
- **Payments**: PayPal Subscriptions
- **Hosting**: GitHub Pages + Vercel (for API)

## Key Files
| File | Purpose |
|------|---------|
| `ChordsApp/app.js` | Main application logic (~178KB) |
| `ChordsApp/index.html` | Main app HTML |
| `ChordsApp/styles.css` | Application styles |
| `ChordsApp/server.js` | Backend server |
| `ChordsApp/song-library.js` | Song management |
| `ChordsApp/live-mode.js` | Live performance features |
| `ChordsApp/session-manager.js` | Session handling |
| `ChordsApp/session-ui.js` | Session UI components |
| `index.html` | Main website landing page |

## Directory Structure
```
ori-code.github.io/
├── ChordsApp/          # Main chord application
│   ├── api/            # API endpoints
│   └── node_modules/   # Dependencies
├── ChordsAppClaude/    # Claude-assisted version (backup?)
├── AI/                 # AI-related files
├── BackUp/             # Backup files
├── images/             # Image assets
├── css/                # Main site CSS
├── js/                 # Main site JS
└── txt/                # Text/config files
```

## Recent Work (from git log)
- Metadata format preservation during transpose
- Interactive dropdown editor for arrangement tags
- Section headers normalization (uppercase)
- Dark theme support for section editor

## User Preferences
<!-- Add preferences here as discovered -->

## Important Notes
<!-- Add important notes here during development -->

## Coding Conventions
<!-- Add conventions as discovered -->

---
*Last updated: December 2024*
