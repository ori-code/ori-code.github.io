# DOM Elements Reference — index.html

## Header & Navigation
| ID | Role |
|----|------|
| `sideMenuToggle` | Hamburger menu opener |
| `appVersion` | Version number display |
| `signInButton` | Auth trigger |
| `profileMenu` | Profile dropdown (contains `mySubscriptionBtn`, `signOutBtn`) |
| `themeToggle` | Light/dark toggle |
| `appNavBar` | Main navigation bar with tabs |
| `liveSessionSubmenu` | Sub-menu for session create/join/manage |
| `navCreateSession` | Create session button |
| `navJoinSession` | Join session button |
| `navMySessions` | View user's sessions |
| `toolsCombinedView` | Combined metronome + pads view section |

## Upload & Analysis
| ID | Role |
|----|------|
| `workflow` | Main 3-step workflow container |
| `chartFileInput` | File upload input |
| `pasteImageBtn` | Paste image from clipboard |
| `contentInput` | URL/chord text textarea |
| `fetchUrlBtn` | Fetch URL or analyze text |
| `uploadPreview` | Preview panel for uploaded image |
| `previewImage` | Uploaded image display |
| `analyzeButton` | Trigger AI analysis |
| `autoAnalyzeCheckbox` | Auto-analyze toggle |
| `intenseScanCheckbox` | Intense scan mode (Pro only) |
| `analysisStatus` | Status panel with animation |
| `aiReferencePreview` | Raw v4 format output preview |
| `aiReferenceContent` | Raw content `<pre>` |

## Preview Section Header
| ID | Role |
|----|------|
| `previewSection` | Print preview header |
| `previewHeaderTitle` | "Print Preview" h2 |
| `toggleControlsBtn` / `toggleControlsBtn2` | Toggle main controls |
| `toggleEditorBtn` / `toggleEditorBtn2` | Toggle edit workspace |
| `headerLivePreview` | Open live preview mode |
| `headerSaveSong` | Save to library |
| `headerLoadSong` | Load from library |
| `headerSaveAsImage` | Export as PNG/JPG |
| `printButton` | Print |
| `headerAutoFit` | Auto-fit to 1 page |
| `headerPadsBtn` | Open pads modal |
| `headerMetronomeBtn` | Open metronome modal |
| `headerGoLiveBtn` | Enter live mode |

## Side Menu Panel (IDs)
| ID | Role |
|----|------|
| `sideMenuPanel` | Main side menu container |
| `sideMenuOverlay` | Overlay for closing |
| `sideMenuClose` | Close button |
| **Display Controls** | |
| `sideMenuNashvilleMode` | Mode dropdown (chords/Nashville/Roman/lyrics) |
| `sideMenuFontSize` | Font size slider (8–28pt) |
| `sideMenuLineHeight` | Line spacing slider (1.0–2.0) |
| `sideMenuCharSpacing` | Character spacing slider (0–8px) |
| `sideMenuBadges` | Show badges toggle |
| `followArrangementBtn` | Follow arrangement toggle |
| `sideMenuShowControls` | Show/hide controls |
| `sideMenuShowEditor` | Show/hide editor |
| `sideMenuDarkMode` | Dark mode toggle |
| `hideEmojisToggle` | Hide emoji badges |
| `plainChordsToggle` | Plain chords mode |
| **Layout** | |
| `sideMenuColumns` | Columns dropdown (1–4) |
| `sideMenuLanguage` | Language selector (EN/עברית) |
| `sideMenuAutoFit` | Auto-fit button |
| **Transpose** | |
| `sideMenuKey` | Key selector dropdown |
| `sideMenuTransposeDown` / `sideMenuTransposeUp` | Transpose buttons |
| `sideMenuTransposeVal` | Current transposition display |
| `sideMenuTransposeReset` | Reset transposition |
| `.key-btn` (class) | Quick key buttons (C–B) |
| **Song Info** | |
| `sideMenuBPM` | BPM input (40–240) |
| `sideMenuTime` | Time signature selector |
| **Library** | |
| `sideMenuSave` | Save song |
| `sideMenuLoad` | Load song |
| `sideMenuBulkImport` | Bulk import |
| `sideMenuUpdate` | Update song |
| **Sessions** | |
| `sideMenuCreateSession` | Create session |
| `sideMenuJoinSession` | Join session |
| `sideMenuMySessions` | View sessions |
| `sideMenuGoLive` | Enter live mode |
| **Mini Pads** | |
| `miniPadsGrid` | 12-key pad grid |
| `miniPadStop` | Stop all pads |
| `miniPadVolume` | Volume slider |
| `miniPadNowPlaying` | Currently playing display |
| **Mini Metronome** | |
| `miniMetronomePlay` | Play button |
| `miniMetronomeBpm` | BPM display |
| `miniMetronomeBpmSlider` | BPM slider |
| `miniMetronomeVolume` | Volume |
| `miniMetronomeMult` | Double time toggle |
| `miniMetronomeTap` | Tap tempo |
| **User Profile** | |
| `sideMenuUserProfile` | Profile section (hidden if logged out) |
| `sideMenuUserLogo` | Uploaded logo image |
| `logoUploadInput` | Logo file input |
| `sideMenuUserName` | User name display |
| `sideMenuTierBadge` | Subscription tier badge |
| `brandingTextInput` | Band/church name |
| `clearLogoBtn` | Remove logo |
| `toggleAchordimBrandingBtn` | Hide footer toggle |
| `sideMenuUsageIndicator` | Usage stats |
| `sideMenuScansIndicator` | Remaining scans |
| `sideMenuUpgradeButton` | Upgrade CTA |
| `sideMenuSignOut` | Sign out |
| **Active Session Info** | |
| `sideMenuActiveSession` | Session info (shown when broadcasting) |
| `sideMenuSessionCode` | Session code display |
| `sideMenuQRCode` | QR code container |
| `sideMenuSessionLink` | Join link |
| `sideMenuCopyLink` | Copy link button |

## Editor & Preview
| ID | Role |
|----|------|
| `editor` | Edit workspace section |
| `visualEditor` | Main text editor (above-line format) |
| `songbookOutput` | Output in [C] inline format |
| `livePreview` | Live print preview HTML area |
| `sessionSection` | Live session controls area |
| `sessionStatusIndicator` | Active session badge |

## Modals
| ID | Role |
|----|------|
| `customAlertModal` | Custom alert dialog — **z-index: 300000** (must be above all modals) |
| `customAlertIcon` | Alert icon |
| `customAlertTitle` | Alert title |
| `customAlertMessage` | Alert message |
| `customAlertOk` | Confirm button |
| `customConfirmModal` | Custom confirm dialog — **z-index: 300000** (must be above all modals) |
| `customConfirmIcon` | Confirm icon |
| `customConfirmTitle` | Confirm title |
| `customConfirmMessage` | Confirm message |
| `customConfirmOk` | OK/confirm button |
| `customConfirmCancel` | Cancel button |
| `padsModal` | Full pads controller |
| `padsModalClose` | Close pads |
| `metronomeModal` | Full metronome controller |
| `metronomeModalClose` | Close metronome |
| `midiSettingsModal` | MIDI configuration |
| `liveModeCloseBtn` | Exit live mode |
| `sessionManagerModal` | Manage Session modal — **z-index: 100000**; contains QR code, participants, playlist |
| `liveAddSongModal` | Add Song to Playlist modal (dynamically created) — **z-index: 200000** |

## Pads Modal Controls
| ID | Role |
|----|------|
| `padsCrossfade` | Crossfade slider (0.1–5s) |
| `padsLowPass` | Low-pass filter |
| `padsHighPass` | High-pass filter |
| `padsReverb` | Reverb amount |
| `padsPan` | Pan slider (-1 to 1) |
| `padsVolume` | Volume slider |

## Metronome Modal Controls
| ID | Role |
|----|------|
| `metronome-play` | Play/stop button |
| `metronome-bpm` | BPM display |
| `metronome-bpm-slider` | BPM slider |
| `metronome-volume` | Volume slider |
| `metronome-tap` | Tap tempo |
| `metronome-beats` | Beat dots container |
| `metronome-mult` | Multiplier button |

## MIDI Settings Modal
| ID | Role |
|----|------|
| `midiSettingsModal` | MIDI configuration |
| `midiDeviceStatus` | Connection status |
| `midiMapping-scrollDown` | CC mapping display |
| `midiMapping-scrollUp` | CC mapping display |
| `midiMapping-nextSong` | CC mapping display |
| `midiMapping-prevSong` | CC mapping display |

## Live Mode Elements (injected dynamically)
| ID | Role |
|----|------|
| `liveModeOverlay` | Full-screen overlay container |
| `liveModeContent` | Song content display area |
| `liveMetroBpm` | Metronome BPM in live mode |
| `liveMetroPlay` | Metronome play in live mode |
| `liveModePlaylist` | Playlist sidebar |
| `liveAutoScrollProgress` | Horizontal progress bar |
| `liveVerticalTimeline` | Vertical timeline element |
| `liveModeSessionId` | Session code section in playlist sidebar |
| `liveModeSessionCode` | Session code text display |
| `editSessionBtn` | "Manage Session" button in sidebar (leader only, no QR here) |

## Manage Session Modal Elements
| ID | Role |
|----|------|
| `sessionManagerCode` | Session code display (large monospace) |
| `sessionManagerTitle` | Session title/name below code |
| `sessionManagerQR` | QR code image (generated on modal open via api.qrserver.com) |
| `participantCount` | Participant count badge |
| `participantsList` | Participant rows container |
| `sessionManagerPlaylist` | Playlist rows container in modal |
| `sessionManagerPlaylistCount` | Playlist count badge |
| `allowSingersToggle` | Toggle for singer mode |
| `singerLinkSection` | Singer link display (shown when singers enabled) |
| `singerLinkDisabled` | Placeholder (shown when singers disabled) |

## Add Song Modal Elements (dynamically created, `liveAddSongModal`)
| ID | Role |
|----|------|
| `liveAddSongSource` | Source dropdown (All Songs / Public Songs / Books) |
| `liveAddSongSearch` | Search input |
| `liveAddSongSelectBtn` | "Select"/"Cancel" toggle for multi-select mode |
| `liveAddSongList` | Song rows container |
| `liveAddSongBulkBar` | Bottom bar (shown in select mode): count + Select All + Add Selected |
| `liveAddSongSelectedCount` | "N selected" count label in bulk bar |

## CSS Classes (Key)
| Class | Purpose |
|-------|---------|
| `.live-preview` | Print preview A4 page |
| `.preview-page` | Single page container |
| `.chord-line` | Chord row (above lyric) |
| `.lyric-line` | Lyric row |
| `.rtl-content` | RTL text (Hebrew/Arabic) in livePreview |
| `.section-block` | Section container (Verse, Chorus, etc.) |
| `.badge` | Section badge (V1, C, B...) |
| `.hide-badges` | Applied to livePreview to hide badges |
| `.plain-chords` | Applied to livePreview for plain chord mode |
| `.side-menu-panel.open` | Side menu open state |
| `.playlist-drag-item` | Drag-droppable playlist row |
