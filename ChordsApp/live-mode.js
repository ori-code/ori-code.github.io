// aChordim Live Mode - Full-screen performance view
// Allows both leaders and players to view songs in distraction-free mode

const liveMode = {
    isActive: false,
    controlsVisible: true,
    sidebarVisible: false,
    currentSongContent: '',
    currentKey: 'C Major',
    currentTransposeSteps: 0,
    currentSongId: null,
    currentSongName: '',
    hideControlsTimeout: null,
    displayMode: 'chords',
    showBadges: true,
    showBorders: true,
    showTimeline: false, // Hidden by default, auto-shows when auto-scroll is ON
    autoHidePlaylist: true,
    showPlaylistWithControls: false,
    fullOverviewMode: false,
    savedDisplaySettings: null,
    currentColumnLayout: 2,
    currentFontSize: 14,
    isSingerMode: false, // Singer mode: chords + lyrics, limited controls (no transpose)
    isPublicViewMode: false, // Public view mode: viewing shared public song
    songMetronomeEnabled: {}, // Track which songs have metronome enabled { songId: true/false }
    songPadEnabled: {}, // Track which songs have pad enabled { songId: true/false }
    songPadKey: {}, // Track selected pad key per song { songId: 'C' | 'D' | etc. }
    songAutoScrollEnabled: {}, // Track which songs have auto-scroll enabled { songId: true/false }
    playlistLocked: false, // When true, songs can only be changed via playlist clicks
    miniAudioSyncInterval: null, // Interval for syncing mini audio controls

    // Auto-scroll state
    autoScrollEnabled: false,
    autoScrollPaused: false,
    autoScrollDuration: 180, // Default 3 minutes in seconds
    autoScrollStartTime: null,
    autoScrollPausedAt: null,
    autoScrollProgress: 0, // 0-1 progress
    autoScrollAnimationId: null,
    autoScrollManualOverride: false,
    lastManualScrollTime: 0,

    /**
     * Save Live Mode preferences to Firebase
     */
    async saveLiveModePreferences() {
        const user = window.auth?.currentUser;
        if (!user) return;

        const prefs = {
            columnLayout: this.currentColumnLayout,
            fontSize: this.currentFontSize || 14,
            displayMode: this.displayMode,
            showBadges: this.showBadges,
            showBorders: this.showBorders,
            showTimeline: this.showTimeline,
            autoHidePlaylist: this.autoHidePlaylist,
            savedAt: Date.now()
        };

        try {
            await firebase.database().ref(`users/${user.uid}/liveModePreferences`).set(prefs);
            console.log('✅ Live Mode preferences saved:', prefs);
        } catch (error) {
            console.error('❌ Error saving Live Mode preferences:', error);
        }
    },

    /**
     * Load Live Mode preferences from Firebase
     */
    async loadLiveModePreferences() {
        const user = window.auth?.currentUser;
        if (!user) return null;

        try {
            const snapshot = await firebase.database().ref(`users/${user.uid}/liveModePreferences`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('❌ Error loading Live Mode preferences:', error);
            return null;
        }
    },

    /**
     * Save per-song preferences to Firebase (session-based)
     * Stored at: sessions/{sessionId}/playerPreferences/{uid}/{songId}/
     */
    async saveSongPreferences(songId, prefs = {}) {
        const user = window.auth?.currentUser;
        const sessionId = window.sessionManager?.activeSession;

        // Debug logging for troubleshooting
        if (!user) {
            console.warn('⚠️ saveSongPreferences: No authenticated user');
            return;
        }
        if (!songId) {
            console.warn('⚠️ saveSongPreferences: No songId provided');
            return;
        }
        if (!sessionId) {
            console.warn('⚠️ saveSongPreferences: No active session');
            return;
        }

        try {
            // Load existing preferences first to merge
            const existing = await this.loadSongPreferences(songId) || {};
            const merged = { ...existing, ...prefs, savedAt: Date.now() };

            await firebase.database()
                .ref(`sessions/${sessionId}/playerPreferences/${user.uid}/${songId}`)
                .set(merged);
            console.log(`✅ Saved session preferences for song ${songId}:`, merged);
        } catch (error) {
            console.error('❌ Error saving song preferences:', error);
        }
    },

    /**
     * Load per-song preferences from Firebase (session-based)
     * Returns null if no session or no preferences (use song defaults)
     */
    async loadSongPreferences(songId) {
        const user = window.auth?.currentUser;
        const sessionId = window.sessionManager?.activeSession;

        if (!user || !songId || !sessionId) {
            console.log(`📖 loadSongPreferences skipped: user=${!!user}, songId=${songId}, sessionId=${!!sessionId}`);
            return null;
        }

        try {
            const path = `sessions/${sessionId}/playerPreferences/${user.uid}/${songId}`;
            console.log(`📖 Loading preferences from: ${path}`);
            const snapshot = await firebase.database()
                .ref(path)
                .once('value');
            const prefs = snapshot.val();
            console.log(`📖 Loaded preferences:`, prefs);
            return prefs;
        } catch (error) {
            console.error('❌ Error loading song preferences:', error);
            return null;
        }
    },

    /**
     * Save per-song font size (convenience method)
     */
    async saveSongFontSize(songId, fontSize) {
        await this.saveSongPreferences(songId, { fontSize });
    },

    /**
     * Load per-song font size (convenience method)
     */
    async loadSongFontSize(songId) {
        const prefs = await this.loadSongPreferences(songId);
        return prefs?.fontSize || null;
    },

    /**
     * Save per-song column layout (convenience method)
     */
    async saveSongColumnLayout(songId, columns) {
        await this.saveSongPreferences(songId, { columns });
    },

    /**
     * Save per-song transpose (convenience method)
     */
    async saveSongTranspose(songId, transposeSteps) {
        await this.saveSongPreferences(songId, { transposeSteps });
    },

    /**
     * Save per-song borders visibility (convenience method)
     */
    async saveSongBorders(songId, showBorders) {
        await this.saveSongPreferences(songId, { showBorders });
    },

    /**
     * Set font size for Live Mode display
     */
    setFontSize(size) {
        this.currentFontSize = size;

        const chartDisplay = document.getElementById('liveModeChartDisplay');
        if (chartDisplay) {
            chartDisplay.style.fontSize = size + 'pt';
        }

        // Update zoom display
        const zoomValue = document.getElementById('liveModeZoomValue');
        if (zoomValue) zoomValue.textContent = size + 'pt';

        // Save per-song font size if we have a current song, otherwise save global
        if (this.currentSongId) {
            this.saveSongFontSize(this.currentSongId, size);
        } else {
            this.saveLiveModePreferences();
        }

        console.log(`📺 Font size set to ${size}pt${this.currentSongId ? ` for song ${this.currentSongId}` : ''}`);
    },

    /**
     * Enter live mode with current song
     */
    async enter() {
        const visualEditor = document.getElementById('visualEditor');
        const keySelector = document.getElementById('keySelector');

        // Check if we have content in the editor
        const hasEditorContent = visualEditor && visualEditor.value.trim();

        // Check if we're in a session with a playlist
        const inSession = window.sessionManager && window.sessionManager.activeSession;

        if (!hasEditorContent && !inSession) {
            if (window.sessionUI) {
                window.sessionUI.showToast('No song loaded. Please analyze or load a song first.');
            }
            return;
        }

        // Get current song data from editor (if available)
        if (hasEditorContent) {
            this.currentSongContent = visualEditor.value;

            // Try to extract key from content's metadata line first (e.g., "Key: G • BPM: 120")
            let extractedKey = null;
            const keyMatch = visualEditor.value.match(/Key:\s*([A-G][#b]?(?:\s*(?:Major|Minor|m|maj|min))?)/i);
            if (keyMatch && keyMatch[1]) {
                extractedKey = keyMatch[1].trim();
            }

            // Use extracted key, or keySelector value, with normalization
            const rawKey = extractedKey || (keySelector && keySelector.value) || 'C Major';
            this.currentKey = window.normalizeKey ? window.normalizeKey(rawKey) : rawKey;

            this.currentTransposeSteps = window.currentTransposeSteps || 0;
            this.currentSongName = window.currentSongName || 'Untitled';
            this.currentSongId = window.currentSongId || null;
        } else {
            // No editor content but in session - show empty state, user will tap to see playlist
            this.currentSongContent = '\n\n\n        Tap to view playlist\n        and select a song';
            this.currentKey = 'C Major';
            this.currentTransposeSteps = 0;
            this.currentSongName = 'Select a Song';
            this.currentSongId = null;
        }

        // Sync display options from main editor
        this.syncDisplayOptions();

        // Load and apply saved Live Mode preferences (override synced options)
        const savedPrefs = await this.loadLiveModePreferences();
        if (savedPrefs) {
            if (savedPrefs.columnLayout) this.currentColumnLayout = savedPrefs.columnLayout;
            if (savedPrefs.fontSize) this.currentFontSize = savedPrefs.fontSize;
            if (savedPrefs.displayMode) {
                this.displayMode = savedPrefs.displayMode;
                const liveModeDropdown = document.getElementById('liveModeDisplayMode');
                if (liveModeDropdown) liveModeDropdown.value = savedPrefs.displayMode;
            }
            if (savedPrefs.showBadges !== undefined) {
                this.showBadges = savedPrefs.showBadges;
                const liveModeBadgesCheckbox = document.getElementById('liveModeBadges');
                if (liveModeBadgesCheckbox) liveModeBadgesCheckbox.checked = savedPrefs.showBadges;
            }
            if (savedPrefs.showBorders !== undefined) {
                this.showBorders = savedPrefs.showBorders;
                const liveModeBordersCheckbox = document.getElementById('liveModeBorders');
                if (liveModeBordersCheckbox) liveModeBordersCheckbox.checked = savedPrefs.showBorders;
                // Apply borders visibility
                const chartDisplay = document.getElementById('liveModeChartDisplay');
                if (chartDisplay && !savedPrefs.showBorders) {
                    chartDisplay.classList.add('hide-borders');
                }
            }
            if (savedPrefs.showTimeline !== undefined) {
                this.showTimeline = savedPrefs.showTimeline;
                const liveModeTimelineCheckbox = document.getElementById('liveModeTimeline');
                if (liveModeTimelineCheckbox) liveModeTimelineCheckbox.checked = savedPrefs.showTimeline;
                // Apply timeline visibility
                const timelineContainer = document.getElementById('verticalTimelineContainer');
                if (timelineContainer) {
                    timelineContainer.style.display = savedPrefs.showTimeline ? 'flex' : 'none';
                }
            }
            if (savedPrefs.autoHidePlaylist !== undefined) {
                this.autoHidePlaylist = savedPrefs.autoHidePlaylist;
                const autoHideCheckbox = document.getElementById('liveModeAutoHidePlaylist');
                if (autoHideCheckbox) autoHideCheckbox.checked = savedPrefs.autoHidePlaylist;
            }
            this.updateLayoutButtons();
            // Update zoom display
            const zoomValue = document.getElementById('liveModeZoomValue');
            if (zoomValue) zoomValue.textContent = (this.currentFontSize || 14) + 'pt';
        }

        // Update display
        this.updateDisplay();

        // Show overlay
        const overlay = document.getElementById('liveModeOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            this.isActive = true;
            this.sidebarVisible = false;

            // Show controls and start auto-hide timer
            this.showControls();
            this.startAutoHideTimer();

            // Lock body scroll
            document.body.style.overflow = 'hidden';
        }

        // Enable Full Overview mode by default
        if (!this.fullOverviewMode) {
            this.toggleFullOverview();
        }

        // Update session controls visibility
        this.updateSessionControls();

        // Sync mini metronome/pad controls
        this.syncMiniAudioControls();
        this.startMiniAudioSync();

        // If in session but no song loaded, show playlist immediately
        if (!hasEditorContent && inSession) {
            setTimeout(() => this.showPlaylist(), 500);
        }

        // If player, check if leader has a current song and display it
        if (inSession && !window.sessionManager.isLeader && window.sessionManager.inLiveMode) {
            const leaderSong = window.sessionManager.getLeaderCurrentSong();
            if (leaderSong) {
                console.log('📺 Loading leader current song:', leaderSong.name);
                this.updateFromBroadcast(leaderSong);
            }
        }

        // Initialize MIDI controller for hands-free control
        this.initMIDI();

        // Initialize auto-scroll (with error handling)
        try {
            this.setupAutoScrollListeners();
            if (this.currentSongId) {
                await this.initAutoScrollForSong(this.currentSongId);
            } else {
                this.updateAutoScrollUI();
            }
        } catch (err) {
            console.error('Auto-scroll init error:', err);
            // Continue even if auto-scroll fails
        }

        console.log('📺 Entered Live Mode:', this.currentSongName);
    },

    /**
     * Exit live mode
     */
    exit() {
        const overlay = document.getElementById('liveModeOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            this.isActive = false;

            // Restore body scroll
            document.body.style.overflow = '';
        }

        // Clear timeout
        if (this.hideControlsTimeout) {
            clearTimeout(this.hideControlsTimeout);
        }

        // Clear mini audio sync interval
        if (this.miniAudioSyncInterval) {
            clearInterval(this.miniAudioSyncInterval);
            this.miniAudioSyncInterval = null;
        }

        // Stop auto-scroll
        this.stopAutoScroll();

        // Reset full overview mode
        if (this.fullOverviewMode) {
            this.fullOverviewMode = false;
            this.savedDisplaySettings = null;
            const btn = document.getElementById('liveModeFullOverview');
            if (btn) {
                btn.style.background = 'var(--button-bg)';
                btn.style.borderColor = 'var(--border)';
                btn.textContent = '📄 Full Overview';
            }
        }

        // Reset singer mode - restore hidden controls
        if (this.isSingerMode) {
            this.isSingerMode = false;
            const controlsToRestore = [
                'liveModeDisplayMode',
                'liveModeTransposeRow',
                'liveModePlaylistBtn',
                'liveModeLayout1',
                'liveModeLayout2',
                'liveModeFullOverview',
                'liveModeBadges',
                'liveModeCurrentKey'
            ];
            controlsToRestore.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = '';
            });
            // Also restore badges label
            const badgesCheckbox = document.getElementById('liveModeBadges');
            if (badgesCheckbox && badgesCheckbox.parentElement) {
                badgesCheckbox.parentElement.style.display = '';
            }
        }

        // Reset public view mode - restore hidden controls
        if (this.isPublicViewMode) {
            this.isPublicViewMode = false;
            // Restore playlist button
            const playlistBtn = document.getElementById('liveModePlaylistBtn');
            if (playlistBtn) playlistBtn.style.display = '';
            // Restore follow checkbox
            const followCheckbox = document.getElementById('followLeaderCheckbox');
            if (followCheckbox && followCheckbox.parentElement) {
                followCheckbox.parentElement.style.display = '';
            }
        }

        console.log('📺 Exited Live Mode');
    },

    /**
     * Enter Singer Mode - simplified view for anonymous users
     * Shows chords and lyrics, hides transpose controls
     */
    async enterSingerMode() {
        this.isSingerMode = true;
        this.displayMode = 'chords'; // Show chords for singers

        // Force the dropdown to chords mode so updateDisplay uses it
        const displayDropdown = document.getElementById('liveModeDisplayMode');
        if (displayDropdown) displayDropdown.value = 'chords';

        // Also sync the main editor dropdown for makeChordsBold
        const nashvilleDropdown = document.getElementById('nashvilleMode');
        if (nashvilleDropdown) nashvilleDropdown.value = 'chords';

        // Show overlay first
        const overlay = document.getElementById('liveModeOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            this.isActive = true;
            this.sidebarVisible = false;

            // Lock body scroll
            document.body.style.overflow = 'hidden';
        }

        // Hide controls that singers shouldn't see (only transpose)
        const controlsToHide = [
            'liveModeDisplayMode',       // No display mode dropdown for singers
            'liveModeTransposeRow'       // Hide entire transpose row (-1, key, +1)
        ];

        controlsToHide.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Update UI to show singer mode
        const songNameEl = document.getElementById('liveModeSongName');
        if (songNameEl) {
            songNameEl.textContent = 'Waiting for leader...';
        }

        // Show simplified controls
        this.showControls();

        // Load saved font size preference (singers can still zoom)
        const savedPrefs = await this.loadLiveModePreferences();
        if (savedPrefs && savedPrefs.fontSize) {
            this.currentFontSize = savedPrefs.fontSize;
            const zoomValue = document.getElementById('liveModeZoomValue');
            if (zoomValue) zoomValue.textContent = this.currentFontSize + 'pt';
        }

        console.log('🎤 Entered Singer Mode (lyrics only)');
    },

    /**
     * Enter Public View Mode - for viewing shared public songs
     * Shows all controls except playlist (single song view)
     */
    async enterPublicViewMode(songData, songId) {
        this.isPublicViewMode = true;

        // Set song data
        this.currentSongContent = songData.content || songData.baselineChart || '';
        this.currentSongId = songId;
        this.currentKey = songData.key || 'C Major';
        this.currentTransposeSteps = 0;
        this.displayMode = 'chords'; // Default to chords view

        // Build song name from structured fields
        const title = songData.title || songData.name || 'Untitled';
        const author = songData.author ? ` - ${songData.author}` : '';
        this.currentSongName = `${title}${author}`;

        // Sync key selector for formatForPreview to work correctly
        const keySelector = document.getElementById('keySelector');
        if (keySelector && this.currentKey) {
            keySelector.value = this.currentKey;
        }

        // Sync display mode dropdowns
        const displayDropdown = document.getElementById('liveModeDisplayMode');
        if (displayDropdown) displayDropdown.value = this.displayMode;
        const nashvilleDropdown = document.getElementById('nashvilleMode');
        if (nashvilleDropdown) nashvilleDropdown.value = this.displayMode;

        // Show overlay
        const overlay = document.getElementById('liveModeOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            this.isActive = true;
            this.sidebarVisible = false;
            document.body.style.overflow = 'hidden';
        }

        // Hide ONLY playlist button (single song view, no session)
        const playlistBtn = document.getElementById('liveModePlaylistBtn');
        if (playlistBtn) playlistBtn.style.display = 'none';

        // Hide session-only elements
        const followCheckbox = document.getElementById('followLeaderCheckbox');
        if (followCheckbox && followCheckbox.parentElement) {
            followCheckbox.parentElement.style.display = 'none';
        }
        const roleDisplay = document.querySelector('#liveModeOverlay .role-display');
        if (roleDisplay) roleDisplay.style.display = 'none';

        // Apply font size from song data or default
        this.currentFontSize = songData.fontSize || 14;
        this.currentColumnLayout = parseInt(songData.columnCount) || 2;

        // Apply font size to chart display BEFORE updateDisplay
        const chartDisplay = document.getElementById('liveModeChartDisplay');
        if (chartDisplay) {
            chartDisplay.style.fontSize = this.currentFontSize + 'pt';
        }

        // Show controls and update display
        this.showControls();
        this.updateDisplay();

        // Update zoom display
        const zoomValue = document.getElementById('liveModeZoomValue');
        if (zoomValue) zoomValue.textContent = this.currentFontSize + 'pt';

        // Update column layout buttons
        this.setColumnLayout(this.currentColumnLayout);

        console.log('🌐 Entered Public View Mode:', this.currentSongName);
    },

    /**
     * Detect if text contains RTL characters (Hebrew, Arabic, etc.)
     */
    detectRTL(text) {
        const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return rtlChars.test(text);
    },

    /**
     * Update the song display
     */
    updateDisplay() {
        const chartDisplay = document.getElementById('liveModeChartDisplay');
        const songNameEl = document.getElementById('liveModeSongName');
        const songKeyEl = document.getElementById('liveModeSongKey');
        const currentKeyEl = document.getElementById('liveModeCurrentKey');

        // Force chords mode for singers (no transpose, but they see chords)
        if (this.isSingerMode) {
            this.displayMode = 'chords';
        }

        if (chartDisplay) {
            // Use formatted print preview HTML if available
            if (window.formatForPreview && this.currentSongContent) {
                // Sync key selector for Nashville numbers calculation
                const keySelector = document.getElementById('keySelector');
                const originalKey = keySelector ? keySelector.value : null;
                if (keySelector && this.currentKey) {
                    keySelector.value = this.currentKey;
                }

                // Sync display mode for chord formatting
                // Use flag to prevent triggering subscription check in change event
                const nashvilleDropdown = document.getElementById('nashvilleMode');
                const originalMode = nashvilleDropdown ? nashvilleDropdown.value : null;
                if (nashvilleDropdown && this.displayMode) {
                    window._skipNashvilleCheck = true;
                    nashvilleDropdown.value = this.displayMode;
                    window._skipNashvilleCheck = false;
                }

                // Apply makeChordsBold first (handles Nashville numbers, lyrics mode, etc.)
                let processedContent = this.currentSongContent;

                if (window.makeChordsBold) {
                    processedContent = window.makeChordsBold(processedContent);
                }

                // Restore original values
                if (keySelector && originalKey !== null) {
                    keySelector.value = originalKey;
                }
                if (nashvilleDropdown && originalMode !== null) {
                    window._skipNashvilleCheck = true;
                    nashvilleDropdown.value = originalMode;
                    window._skipNashvilleCheck = false;
                }

                const formattedHTML = window.formatForPreview(processedContent, {
                    enableSectionBlocks: true
                });
                chartDisplay.innerHTML = formattedHTML;

                // Parse and render arrangement badges separately for Live Mode
                // (formatForPreview only adds badges inside .song-header which requires metadata)
                if (!chartDisplay.querySelector('.section-badges-row')) {
                    const cleanContent = this.currentSongContent.replace(/<[^>]*>/g, '');
                    let badgesList = [];

                    // Check if content is v4 format and use parser
                    if (window.chordsAppParser && /\{(?:title|key|tempo|subtitle|artist|time|capo):/i.test(cleanContent)) {
                        // Use new parseArrangementFull for full object support (repeat counts, flow arrows)
                        badgesList = window.chordsAppParser.parseArrangementFull(cleanContent);
                    } else {
                        // Legacy format: parse inline notation
                        const inlinePattern = /\((PC|CD|TURN|BRK|INT|TAG|CODA|[VBICOT])(\d*)\)(\d+)?/gi;
                        const inlineMatches = [...cleanContent.matchAll(inlinePattern)];
                        badgesList = inlineMatches.map(match => {
                            const sectionType = match[1].toUpperCase();
                            const sectionNum = match[2] || '';
                            const label = sectionNum ? `${sectionType}${sectionNum}` : sectionType;
                            const repeat = match[3] ? parseInt(match[3]) : 1;
                            return { type: 'badge', label, repeat };
                        });
                    }

                    if (badgesList.length > 0) {
                        // Detect RTL for badge ordering
                        const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\uFB50-\uFDFF\uFE70-\uFEFF]/;
                        const isRTLContent = rtlChars.test(cleanContent);

                        let badgeItems = badgesList
                            .filter(item => item.type === 'badge' || (typeof item === 'string' && item !== '>')) // Skip flow arrows
                            .map(item => {
                                // Handle badges (support both object and string formats)
                                const label = typeof item === 'string' ? item : item.label;
                                const repeat = typeof item === 'object' ? item.repeat : 1;
                                const colorClass = window.chordsAppParser
                                    ? window.chordsAppParser.getBadgeColorClass(label)
                                    : (label.replace(/\d+$/, '') === 'I' ? 'badge-intro' :
                                       label.replace(/\d+$/, '') === 'V' ? 'badge-verse' :
                                       label.replace(/\d+$/, '') === 'C' ? 'badge-chorus' :
                                       label.replace(/\d+$/, '') === 'B' ? 'badge-bridge' :
                                       label.replace(/\d+$/, '') === 'PC' ? 'badge-prechorus' :
                                       label.replace(/\d+$/, '') === 'O' ? 'badge-outro' :
                                       label.replace(/\d+$/, '') === 'TURN' ? 'badge-turn' :
                                       label.replace(/\d+$/, '') === 'BRK' ? 'badge-break' :
                                       'badge-other');
                                const repeatSup = repeat > 1 ? `<sup class="repeat-count">${repeat}x</sup>` : '';
                                return `<span class="section-badge ${colorClass}">${label}${repeatSup}</span>`;
                            });

                        // Reverse badges array for RTL content so V1 appears on right
                        if (isRTLContent) {
                            badgeItems = badgeItems.reverse();
                        }
                        const badges = badgeItems.join('');

                        const badgesRow = document.createElement('div');
                        badgesRow.className = 'section-badges-row';
                        const badgesDir = isRTLContent ? 'rtl' : 'ltr';
                        badgesRow.setAttribute('dir', badgesDir);
                        badgesRow.innerHTML = badges;
                        chartDisplay.insertBefore(badgesRow, chartDisplay.firstChild);
                        console.log('🏷️ Live Mode BADGES RTL DEBUG:');
                        console.log('  isRTLContent:', isRTLContent);
                        console.log('  badges reversed:', isRTLContent);
                    }
                }

                // Add click handlers for section blocks (leader only)
                if (window.sessionManager && window.sessionManager.isLeader) {
                    this.attachSectionClickHandlers();
                }
            } else {
                // Fallback to plain text
                chartDisplay.textContent = this.currentSongContent;
            }

            // Apply saved user preferences to Live Mode display
            this.applySavedPreferences(chartDisplay);

            // Apply badges visibility
            if (this.showBadges) {
                chartDisplay.classList.remove('hide-badges');
            } else {
                chartDisplay.classList.add('hide-badges');
            }

            // Apply saved Live Mode font size (overrides printPreviewPreferences)
            if (this.currentFontSize) {
                chartDisplay.style.fontSize = this.currentFontSize + 'pt';
            }

            // Apply RTL/LTR direction based on content
            const isRTL = this.detectRTL(this.currentSongContent);
            const direction = isRTL ? 'rtl' : 'ltr';
            chartDisplay.setAttribute('dir', direction);
            chartDisplay.style.direction = direction;
            chartDisplay.style.textAlign = isRTL ? 'right' : 'left';
        }

        if (songNameEl) {
            songNameEl.textContent = this.currentSongName;
        }

        if (songKeyEl) {
            const transposeInfo = this.currentTransposeSteps !== 0
                ? ` (${this.currentTransposeSteps > 0 ? '+' : ''}${this.currentTransposeSteps})`
                : '';
            songKeyEl.textContent = `Key: ${this.currentKey}${transposeInfo}`;
        }

        if (currentKeyEl) {
            // Extract the note and show "m" suffix for minor keys (e.g., "A Minor" -> "Am", "C Major" -> "C")
            const keyParts = this.currentKey.split(' ');
            const keyNote = keyParts[0];
            const isMinor = keyParts[1] && keyParts[1].toLowerCase() === 'minor';
            currentKeyEl.textContent = isMinor ? `${keyNote}m` : keyNote;
        }
    },

    /**
     * Toggle controls visibility
     */
    toggleControls() {
        if (this.controlsVisible) {
            this.hideControls();
        } else {
            this.showControls();
            this.startAutoHideTimer();
        }
    },

    /**
     * Show controls
     */
    showControls() {
        const topBar = document.getElementById('liveModeTopBar');
        const bottomBar = document.getElementById('liveModeBottomBar');

        if (topBar) {
            topBar.style.opacity = '1';
            topBar.style.pointerEvents = 'auto';
        }
        if (bottomBar) {
            bottomBar.style.opacity = '1';
            bottomBar.style.pointerEvents = 'auto';
        }

        this.controlsVisible = true;

        // Show playlist if preference is enabled
        if (this.showPlaylistWithControls && !this.sidebarVisible) {
            this.showPlaylist();
        }
    },

    /**
     * Hide controls
     */
    hideControls() {
        const topBar = document.getElementById('liveModeTopBar');
        const bottomBar = document.getElementById('liveModeBottomBar');

        if (topBar) {
            topBar.style.opacity = '0';
            topBar.style.pointerEvents = 'none';
        }
        if (bottomBar) {
            bottomBar.style.opacity = '0';
            bottomBar.style.pointerEvents = 'none';
        }

        this.controlsVisible = false;

        // Hide playlist when controls hide
        if (this.sidebarVisible) {
            this.hidePlaylist();
        }
    },

    /**
     * Start auto-hide timer for controls
     */
    startAutoHideTimer() {
        if (this.hideControlsTimeout) {
            clearTimeout(this.hideControlsTimeout);
        }

        this.hideControlsTimeout = setTimeout(() => {
            this.hideControls();
        }, 5000);
    },

    /**
     * Transpose the current song
     * @param {number} steps - Number of semitones to transpose (positive or negative)
     */
    transpose(steps) {
        // Use the global transpose function if available
        if (typeof window.transposeChart === 'function') {
            const visualEditor = document.getElementById('visualEditor');
            const keySelector = document.getElementById('keySelector');

            // In Public View Mode, use currentSongContent directly (visualEditor is empty)
            if (this.isPublicViewMode) {
                if (this.currentSongContent && keySelector) {
                    const transposed = window.transposeChart(this.currentSongContent, steps);

                    // Update current key
                    const newKey = this.calculateNewKey(this.currentKey, steps);
                    keySelector.value = newKey;

                    // Update live mode state
                    this.currentSongContent = transposed;
                    this.currentKey = newKey;
                    this.currentTransposeSteps += steps;

                    // Update display
                    this.updateDisplay();

                    console.log(`🎵 Public song transposed ${steps > 0 ? '+' : ''}${steps} to ${newKey}`);
                }
                return;
            }

            if (visualEditor && keySelector) {
                // Get current content and transpose
                const currentContent = visualEditor.value;
                const transposed = window.transposeChart(currentContent, steps);

                // Update editor
                visualEditor.value = transposed;

                // Update current key
                const currentKeyValue = keySelector.value;
                const newKey = this.calculateNewKey(currentKeyValue, steps);
                keySelector.value = newKey;

                // Update live mode state
                this.currentSongContent = transposed;
                this.currentKey = newKey;
                this.currentTransposeSteps += steps;

                // Update display
                this.updateDisplay();

                // Save per-song transpose preference for ALL users (leader and player)
                // Save transpose to session preferences (auto-save)
                if (this.currentSongId) {
                    this.saveSongTranspose(this.currentSongId, this.currentTransposeSteps);
                }

                console.log(`🎵 Transposed ${steps > 0 ? '+' : ''}${steps} to ${newKey}${this.currentSongId ? ` for song ${this.currentSongId}` : ''}`);
            }
        } else {
            console.warn('transposeChart function not available');
        }
    },

    /**
     * Calculate new key after transpose
     * @param {string} currentKey - Current key (e.g., "C Major")
     * @param {number} steps - Transpose steps
     * @returns {string} New key
     */
    calculateNewKey(currentKey, steps) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // Handle unknown or invalid keys
        if (!currentKey || currentKey === 'Unknown' || currentKey === 'Unknown key') {
            // Default to C Major and calculate from there
            const newIndex = ((0 + steps) % 12 + 12) % 12;
            return `${notes[newIndex]} Major`;
        }

        const parts = currentKey.split(' ');
        const note = parts[0];
        const mode = parts.slice(1).join(' ') || 'Major';

        let noteIndex = notes.indexOf(note);
        if (noteIndex === -1) {
            // Try to find with flat notation
            const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
            noteIndex = notes.indexOf(flatToSharp[note] || note);
        }

        if (noteIndex === -1) {
            // Still can't find it, default to C Major
            const newIndex = ((0 + steps) % 12 + 12) % 12;
            return `${notes[newIndex]} Major`;
        }

        const newIndex = ((noteIndex + steps) % 12 + 12) % 12;
        return `${notes[newIndex]} ${mode}`;
    },

    /**
     * Set display mode (chords, both, numbers, lyrics)
     */
    setDisplayMode(mode) {
        this.displayMode = mode;

        // Update display (syncing happens inside updateDisplay now)
        this.updateDisplay();

        // Auto-save preference
        this.saveLiveModePreferences();

        console.log(`📺 Display mode set to: ${mode}`);
    },

    /**
     * Toggle badges visibility
     */
    toggleBadges(show) {
        this.showBadges = show;

        const chartDisplay = document.getElementById('liveModeChartDisplay');
        if (chartDisplay) {
            if (show) {
                chartDisplay.classList.remove('hide-badges');
            } else {
                chartDisplay.classList.add('hide-badges');
            }
        }

        // Auto-save preference
        this.saveLiveModePreferences();

        console.log(`📺 Badges ${show ? 'shown' : 'hidden'}`);
    },

    /**
     * Toggle borders visibility
     */
    toggleBorders(show) {
        this.showBorders = show;

        const chartDisplay = document.getElementById('liveModeChartDisplay');
        if (chartDisplay) {
            if (show) {
                chartDisplay.classList.remove('hide-borders');
            } else {
                chartDisplay.classList.add('hide-borders');
            }
        }

        // Auto-save global preference
        this.saveLiveModePreferences();

        // Also save per-song preference if a song is loaded
        if (this.currentSongId) {
            this.saveSongBorders(this.currentSongId, show);
        }

        console.log(`📺 Borders ${show ? 'shown' : 'hidden'}`);
    },

    /**
     * Toggle vertical timeline visibility
     */
    toggleTimeline(show) {
        this.showTimeline = show;

        const timelineContainer = document.getElementById('verticalTimelineContainer');
        if (timelineContainer) {
            timelineContainer.style.display = show ? 'flex' : 'none';
        }

        // Auto-save preference
        this.saveLiveModePreferences();

        console.log(`📺 Timeline ${show ? 'shown' : 'hidden'}`);
    },

    /**
     * Toggle auto-hide playlist after song selection
     */
    toggleAutoHidePlaylist(autoHide) {
        this.autoHidePlaylist = autoHide;
        this.saveLiveModePreferences();
        console.log(`📺 Auto-hide playlist: ${autoHide ? 'enabled' : 'disabled'}`);
    },

    /**
     * Set column layout (1 or 2 columns)
     */
    setColumnLayout(columns) {
        this.currentColumnLayout = columns;

        const chartDisplay = document.getElementById('liveModeChartDisplay');
        const content = document.getElementById('liveModeContent');
        if (!chartDisplay) return;

        // Exit full overview mode if active
        if (this.fullOverviewMode) {
            this.fullOverviewMode = false;
            chartDisplay.classList.remove('full-overview-active');

            // Reset Full Overview button
            const btn = document.getElementById('liveModeFullOverview');
            if (btn) {
                btn.style.background = 'var(--button-bg)';
                btn.style.borderColor = 'var(--border)';
                btn.textContent = '📄 Full Overview';
            }

            // Reset padding
            if (content) {
                content.style.padding = '0 20px 140px 20px';
            }
        }

        // Clear any conflicting Full Overview styles
        chartDisplay.style.columnCount = '';
        chartDisplay.style.columnWidth = '';

        // Apply column layout
        const A4_HEIGHT_PX = 1123;
        chartDisplay.style.columns = columns.toString();
        chartDisplay.style.columnFill = 'auto';
        chartDisplay.style.height = A4_HEIGHT_PX + 'px';

        if (columns > 1) {
            chartDisplay.style.columnGap = '20px';
            chartDisplay.style.columnRule = '1px solid rgba(0, 0, 0, 0.2)';
        } else {
            chartDisplay.style.columnGap = '0px';
            chartDisplay.style.columnRule = 'none';
        }

        // Update button styles
        const btn1 = document.getElementById('liveModeLayout1');
        const btn2 = document.getElementById('liveModeLayout2');

        if (btn1) {
            btn1.style.background = columns === 1 ? 'var(--primary)' : 'transparent';
            btn1.style.color = columns === 1 ? 'white' : 'var(--text-muted)';
        }
        if (btn2) {
            btn2.style.background = columns === 2 ? 'var(--primary)' : 'transparent';
            btn2.style.color = columns === 2 ? 'white' : 'var(--text-muted)';
        }

        // Save per-song column layout if we have a current song, otherwise save global
        if (this.currentSongId) {
            this.saveSongColumnLayout(this.currentSongId, columns);
        } else {
            this.saveLiveModePreferences();
        }

        console.log(`📺 Layout set to ${columns} column(s)${this.currentSongId ? ` for song ${this.currentSongId}` : ''}`);
    },

    /**
     * Update layout button styles based on current column layout
     */
    updateLayoutButtons() {
        const btn1 = document.getElementById('liveModeLayout1');
        const btn2 = document.getElementById('liveModeLayout2');
        const columns = this.currentColumnLayout;

        if (btn1) {
            btn1.style.background = columns === 1 ? 'var(--primary)' : 'transparent';
            btn1.style.color = columns === 1 ? 'white' : 'var(--text-muted)';
        }
        if (btn2) {
            btn2.style.background = columns === 2 ? 'var(--primary)' : 'transparent';
            btn2.style.color = columns === 2 ? 'white' : 'var(--text-muted)';
        }
    },

    /**
     * Toggle full overview mode - fits entire song on screen
     */
    toggleFullOverview() {
        this.fullOverviewMode = !this.fullOverviewMode;

        const chartDisplay = document.getElementById('liveModeChartDisplay');
        const content = document.getElementById('liveModeContent');
        const btn = document.getElementById('liveModeFullOverview');

        if (!chartDisplay || !content) return;

        if (this.fullOverviewMode) {
            // Save current display settings
            this.savedDisplaySettings = {
                fontSize: chartDisplay.style.fontSize,
                lineHeight: chartDisplay.style.lineHeight,
                columns: chartDisplay.style.columns,
                columnFill: chartDisplay.style.columnFill,
                height: chartDisplay.style.height,
                columnGap: chartDisplay.style.columnGap,
                columnRule: chartDisplay.style.columnRule,
                maxWidth: chartDisplay.style.maxWidth,
                padding: content.style.padding
            };

            // Apply full overview mode - single column, scrollable
            chartDisplay.style.columnCount = '1';
            chartDisplay.style.columns = 'auto';
            chartDisplay.style.columnWidth = 'auto';
            chartDisplay.style.columnFill = 'auto';
            chartDisplay.style.height = 'auto';
            chartDisplay.style.columnGap = '0';
            chartDisplay.style.columnRule = 'none';
            chartDisplay.style.maxWidth = '100%';

            // Adjust padding to maximize space
            content.style.padding = '0 24px 140px 24px';

            // Enable full overview class for CSS overrides (shows song-header with section badges)
            chartDisplay.classList.add('full-overview-active');

            // Respect current badge setting (don't force badges on/off)
            if (this.showBadges) {
                chartDisplay.classList.remove('hide-badges');
            } else {
                chartDisplay.classList.add('hide-badges');
            }

            // Re-render display to apply badge visibility
            this.updateDisplay();

            // Re-apply column settings after updateDisplay (which may reset them)
            chartDisplay.style.columnCount = '1';
            chartDisplay.style.columns = 'auto';
            chartDisplay.style.columnWidth = 'auto';
            chartDisplay.style.columnFill = 'auto';
            chartDisplay.style.height = 'auto';
            chartDisplay.style.columnGap = '0';
            chartDisplay.style.columnRule = 'none';
            chartDisplay.style.maxWidth = '100%';

            // Set readable font size
            this.autoFitFontSize();

            // Start auto-hide timer for controls
            this.startAutoHideTimer();

            // Update button style to show active
            if (btn) {
                btn.style.background = 'rgba(139, 92, 246, 0.3)';
                btn.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                btn.textContent = '📄 Exit Overview';
            }

            console.log('📺 Full Overview mode ON');
        } else {
            // Remove full overview class
            chartDisplay.classList.remove('full-overview-active');

            // Restore saved settings
            if (this.savedDisplaySettings) {
                chartDisplay.style.fontSize = this.savedDisplaySettings.fontSize || '';
                chartDisplay.style.lineHeight = this.savedDisplaySettings.lineHeight || '';
                chartDisplay.style.columns = this.savedDisplaySettings.columns || '';
                chartDisplay.style.columnFill = this.savedDisplaySettings.columnFill || '';
                chartDisplay.style.height = this.savedDisplaySettings.height || '';
                chartDisplay.style.columnGap = this.savedDisplaySettings.columnGap || '';
                chartDisplay.style.columnRule = this.savedDisplaySettings.columnRule || '';
                chartDisplay.style.maxWidth = this.savedDisplaySettings.maxWidth || '800px';
                content.style.padding = this.savedDisplaySettings.padding || '0 20px 140px 20px';
            }

            // Re-apply saved preferences from Firebase
            this.applySavedPreferences(chartDisplay);

            // Update Full Overview button style
            if (btn) {
                btn.style.background = 'var(--button-bg)';
                btn.style.borderColor = 'var(--border)';
                btn.textContent = '📄 Full Overview';
            }

            // Update layout buttons to reflect current state
            this.updateLayoutButtons();

            console.log('📺 Full Overview mode OFF');
        }
    },

    /**
     * Set font size for Full Overview mode
     * Uses a readable default - user can pinch-to-zoom to adjust
     */
    autoFitFontSize() {
        const chartDisplay = document.getElementById('liveModeChartDisplay');
        const content = document.getElementById('liveModeContent');

        if (!chartDisplay || !content) return;

        // Ensure single column layout for measuring
        chartDisplay.style.columnCount = '1';
        chartDisplay.style.columns = 'auto';
        chartDisplay.style.columnWidth = 'auto';
        chartDisplay.style.height = 'auto';
        chartDisplay.style.lineHeight = '1.4';

        // Get available viewport height (minus top bar and bottom controls)
        const viewportHeight = window.innerHeight;
        const topPadding = 50;  // Space for header/title
        const bottomPadding = 120; // Space for bottom controls
        const availableHeight = viewportHeight - topPadding - bottomPadding;

        // Binary search for optimal font size
        let minFont = 6;
        let maxFont = 24;
        let optimalFont = 14;

        // Start with a reference font size to measure
        chartDisplay.style.fontSize = '14pt';

        // Measure content height at reference size
        const referenceHeight = chartDisplay.scrollHeight;

        if (referenceHeight <= availableHeight) {
            // Content already fits, try larger fonts
            while (maxFont - minFont > 0.5) {
                const testFont = (minFont + maxFont) / 2;
                chartDisplay.style.fontSize = testFont + 'pt';

                if (chartDisplay.scrollHeight <= availableHeight) {
                    minFont = testFont;
                    optimalFont = testFont;
                } else {
                    maxFont = testFont;
                }
            }
        } else {
            // Content too large, find smaller font
            while (maxFont - minFont > 0.5) {
                const testFont = (minFont + maxFont) / 2;
                chartDisplay.style.fontSize = testFont + 'pt';

                if (chartDisplay.scrollHeight <= availableHeight) {
                    minFont = testFont;
                    optimalFont = testFont;
                } else {
                    maxFont = testFont;
                }
            }
        }

        // Apply optimal font size (round to 1 decimal)
        optimalFont = Math.round(optimalFont * 10) / 10;
        chartDisplay.style.fontSize = optimalFont + 'pt';

        console.log(`📺 Auto-fit font size: ${optimalFont}pt (viewport: ${availableHeight}px, content: ${chartDisplay.scrollHeight}px)`);
    },

    /**
     * Sync display options from main editor when entering live mode
     */
    syncDisplayOptions() {
        // Sync display mode from main dropdown
        const mainDropdown = document.getElementById('nashvilleMode');
        const liveModeDropdown = document.getElementById('liveModeDisplayMode');
        if (mainDropdown && liveModeDropdown) {
            this.displayMode = mainDropdown.value;
            liveModeDropdown.value = mainDropdown.value;
        }

        // Sync badges checkbox from main checkbox
        const mainBadgesCheckbox = document.getElementById('showBadges');
        const liveModeBadgesCheckbox = document.getElementById('liveModeBadges');
        if (mainBadgesCheckbox && liveModeBadgesCheckbox) {
            this.showBadges = mainBadgesCheckbox.checked;
            liveModeBadgesCheckbox.checked = mainBadgesCheckbox.checked;
        }

        // Apply badges visibility immediately
        const chartDisplay = document.getElementById('liveModeChartDisplay');
        if (chartDisplay) {
            if (this.showBadges) {
                chartDisplay.classList.remove('hide-badges');
            } else {
                chartDisplay.classList.add('hide-badges');
            }
        }

        // Sync column layout from main editor
        const mainColumnCount = document.getElementById('columnCount');
        if (mainColumnCount) {
            this.currentColumnLayout = parseInt(mainColumnCount.value) || 2;
            // Limit to 1 or 2 for live mode (mobile-friendly)
            if (this.currentColumnLayout > 2) this.currentColumnLayout = 2;
        }
        this.updateLayoutButtons();
    },

    /**
     * Update session controls visibility
     */
    updateSessionControls() {
        const sessionControls = document.getElementById('liveModeSessionControls');
        const sessionInfo = document.getElementById('liveModeSessionInfo');
        const followLeaderToggle = document.getElementById('liveModeFollowLeader');
        const followLeaderCheckbox = document.getElementById('followLeaderCheckbox');

        if (window.sessionManager && window.sessionManager.activeSession) {
            if (sessionControls) sessionControls.style.display = 'block';

            if (sessionInfo) {
                const role = window.sessionManager.isLeader ? 'Leader' : 'Player';
                sessionInfo.textContent = `You are: ${role}`;
            }

            // Show Follow Leader toggle only for players
            if (followLeaderToggle) {
                followLeaderToggle.style.display = window.sessionManager.isLeader ? 'none' : 'block';
            }

            // Sync checkbox with session manager state
            if (followLeaderCheckbox && !window.sessionManager.isLeader) {
                followLeaderCheckbox.checked = window.sessionManager.inLiveMode;
            }
        } else {
            if (sessionControls) sessionControls.style.display = 'none';
        }
    },

    /**
     * Toggle follow leader mode (players only)
     */
    toggleFollowLeader(enabled) {
        if (window.sessionManager && !window.sessionManager.isLeader) {
            window.sessionManager.setLiveMode(enabled);
            console.log(`${enabled ? '📻 Following' : '📴 Not following'} leader`);
        }
    },

    /**
     * Toggle playlist sidebar
     */
    togglePlaylist() {
        if (this.sidebarVisible) {
            this.hidePlaylist();
        } else {
            this.showPlaylist();
        }
    },

    /**
     * Set playlist preference (used by checkbox)
     * When checked: playlist shows with controls
     * When unchecked: playlist stays hidden
     */
    setPlaylistVisible(visible) {
        this.showPlaylistWithControls = visible;

        // Immediately show/hide playlist based on checkbox
        if (visible) {
            this.showPlaylist();
        } else {
            this.hidePlaylist();
        }
    },

    /**
     * Toggle playlist lock mode
     * When locked, songs can only be changed via playlist clicks (not buttons/keyboard)
     */
    setPlaylistLocked(locked) {
        this.playlistLocked = locked;
        console.log(`🔒 Playlist ${locked ? 'locked' : 'unlocked'}`);

        // Refresh playlist to update UI
        if (this.sidebarVisible) {
            this.showPlaylist();
        }
    },

    /**
     * Show playlist sidebar
     */
    async showPlaylist() {
        const playlistSidebar = document.getElementById('liveModePlaylistSidebar');
        const playlistContent = document.getElementById('liveModePlaylistContent');
        const sessionIdDiv = document.getElementById('liveModeSessionId');
        const sessionCodeSpan = document.getElementById('liveModeSessionCode');

        if (!playlistSidebar || !playlistContent) return;

        // Slide sidebar in
        playlistSidebar.style.right = '0';
        this.sidebarVisible = true;

        // Show session ID if in an active session
        if (sessionIdDiv && sessionCodeSpan && window.sessionManager?.activeSessionCode) {
            const sessionCode = window.sessionManager.activeSessionCode;
            sessionCodeSpan.textContent = sessionCode;
            sessionIdDiv.style.display = 'block';

            // Generate QR code
            const qrDiv = document.getElementById('liveModeSessionQR');
            if (qrDiv) {
                const joinUrl = `${window.location.origin}${window.location.pathname}?join=${sessionCode.replace('-', '')}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(joinUrl)}`;
                qrDiv.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="width: 120px; height: 120px; display: block;">`;
            }

            // Show/hide "Manage Session" button (leader only)
            const editSessionBtn = document.getElementById('editSessionBtn');
            if (editSessionBtn) {
                editSessionBtn.style.display = window.sessionManager?.isLeader ? 'block' : 'none';
            }
        } else if (sessionIdDiv) {
            sessionIdDiv.style.display = 'none';
        }

        playlistContent.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Loading playlist...</p>';

        try {
            // Get playlist from session manager
            if (window.sessionManager && window.sessionManager.activeSession) {
                const playlist = await window.sessionManager.getPlaylist();
                const isLeader = window.sessionManager.isLeader;

                if (playlist.length === 0) {
                    const addButton = isLeader ? `
                        <button onclick="liveMode.showAddSongModal()" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-top: 12px;">
                            + Add Song
                        </button>
                    ` : '';
                    playlistContent.innerHTML = `<p style="color: var(--text-muted); text-align: center;">No songs in playlist</p>${addButton}`;
                    return;
                }

                // Get current song ID (what player is viewing)
                const currentSongId = this.currentSongId;

                // Get leader's current song ID (what leader is broadcasting)
                const leaderSong = window.sessionManager.leaderCurrentSong;
                const leaderSongId = leaderSong ? leaderSong.songId : null;

                playlistContent.innerHTML = playlist.map((song, index) => {
                    const isCurrent = song.id === currentSongId;
                    const isLeaderPlaying = song.id === leaderSongId && !isLeader;

                    // Different colors: purple for your current, green for leader's current
                    let bgColor = 'var(--button-bg)';
                    let borderColor = 'var(--border)';
                    let numberColor = 'var(--text-muted)';
                    let fontWeight = '400';
                    let indicator = '';

                    if (isCurrent && isLeaderPlaying) {
                        bgColor = 'rgba(139, 92, 246, 0.3)';
                        borderColor = 'rgba(139, 92, 246, 0.5)';
                        numberColor = '#8b5cf6';
                        fontWeight = '600';
                        indicator = '<span style="color: #10b981; font-size: 12px; margin-right: 4px;">👑</span><span style="color: #8b5cf6; font-size: 14px;">▶</span>';
                    } else if (isCurrent) {
                        bgColor = 'rgba(139, 92, 246, 0.3)';
                        borderColor = 'rgba(139, 92, 246, 0.5)';
                        numberColor = '#8b5cf6';
                        fontWeight = '600';
                        indicator = '<span style="color: #8b5cf6; font-size: 14px;">▶</span>';
                    } else if (isLeaderPlaying) {
                        bgColor = 'rgba(16, 185, 129, 0.2)';
                        borderColor = 'rgba(16, 185, 129, 0.4)';
                        numberColor = '#10b981';
                        fontWeight = '500';
                        indicator = '<span style="color: #10b981; font-size: 12px;">👑 Leader</span>';
                    }

                    const metroChecked = liveMode.songMetronomeEnabled[song.id] ? 'checked' : '';
                    const displayBpm = song.bpm || '--';

                    // Build pad key dropdown options
                    const relatedKeys = liveMode.getRelatedKeys(song.originalKey);
                    const selectedPadKey = liveMode.songPadKey[song.id] || (relatedKeys.length > 0 ? relatedKeys[0].value : '');
                    const padKeyOptions = relatedKeys.map(k =>
                        `<option value="${k.value}" ${k.value === selectedPadKey ? 'selected' : ''}>${k.label}</option>`
                    ).join('');
                    const padEnabled = liveMode.songPadEnabled[song.id];

                    // Check if playlist is locked
                    const isLocked = liveMode.playlistLocked;
                    const controlsDisabled = !isLeader || isLocked ? 'disabled' : '';
                    const controlsCursor = !isLeader || isLocked ? 'not-allowed' : 'pointer';
                    const controlsOpacity = !isLeader || isLocked ? '0.4' : '1';

                    // Remove button for leaders (hidden when locked)
                    const removeBtn = (isLeader && !isLocked) ? `
                        <button onclick="event.stopPropagation(); liveMode.removeSongFromPlaylist('${song.id}')"
                                style="width: 22px; height: 22px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                                title="Remove from playlist">×</button>
                    ` : '';

                    // Song info (key, bpm, time signature)
                    const displayKey = song.originalKey || song.key || '--';
                    const displayTimeSig = song.timeSignature || '4/4';

                    // Info row when locked (display only), controls row when unlocked
                    const metroIndicator = liveMode.songMetronomeEnabled[song.id] ? '<span style="color: #10b981; font-weight: bold;"> ✓</span>' : '';
                    const padIndicator = padEnabled ? '<span style="color: #10b981; font-weight: bold;"> ✓</span>' : '';
                    const autoScrollIndicator = liveMode.songAutoScrollEnabled[song.id] ? '<span style="color: #10b981; font-weight: bold;"> ✓</span>' : '';
                    const autoScrollChecked = liveMode.songAutoScrollEnabled[song.id] ? 'checked' : '';
                    const controlsRow = isLocked ? `
                                    <div style="display: flex; gap: 10px; margin-top: 3px; font-size: 11px; color: var(--text-muted);">
                                        <span>🎵 ${displayBpm}${metroIndicator}</span>
                                        <span>🎹 ${displayKey}${padIndicator}</span>
                                        <span>📜${autoScrollIndicator}</span>
                                    </div>` : `
                                    <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center; flex-wrap: wrap;">
                                        <label onclick="event.stopPropagation()" style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); cursor: ${controlsCursor}; opacity: ${controlsOpacity};">
                                            <input type="checkbox" ${metroChecked} ${controlsDisabled} onchange="liveMode.toggleSongMetronome('${song.id}', this.checked)" style="cursor: ${controlsCursor};" />
                                            <span>🎵 ${displayBpm}</span>
                                        </label>
                                        <div onclick="event.stopPropagation()" style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted);">
                                            <input type="checkbox" ${padEnabled ? 'checked' : ''} ${controlsDisabled} onchange="liveMode.toggleSongPad('${song.id}', this.checked)" style="cursor: ${controlsCursor};" />
                                            <span>🎹</span>
                                            <select ${controlsDisabled} onchange="liveMode.changeSongPadKey('${song.id}', this.value)" style="font-size: 10px; padding: 2px 4px; border-radius: 4px; background: var(--input-bg); color: var(--text); border: 1px solid var(--border); cursor: ${controlsCursor}; opacity: ${controlsOpacity};">
                                                ${padKeyOptions}
                                            </select>
                                        </div>
                                        <label onclick="event.stopPropagation()" style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); cursor: ${controlsCursor}; opacity: ${controlsOpacity};">
                                            <input type="checkbox" ${autoScrollChecked} ${controlsDisabled} onchange="liveMode.toggleSongAutoScroll('${song.id}', this.checked)" style="cursor: ${controlsCursor};" />
                                            <span>📜</span>
                                        </label>
                                    </div>`;

                    return `
                        <div onclick="liveMode.loadSongFromPlaylist('${song.id}')"
                             style="padding: 8px 12px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s ease;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="color: ${numberColor}; font-weight: 600; min-width: 20px; font-size: 13px;">${index + 1}</span>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="color: var(--text); font-weight: ${fontWeight}; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.name}</div>
                                    ${controlsRow}
                                </div>
                                ${removeBtn}
                                ${indicator}
                            </div>
                        </div>
                    `;
                }).join('');

                // Add "Add Song" button at bottom for leaders (hidden when locked)
                if (isLeader && !this.playlistLocked) {
                    playlistContent.innerHTML += `
                        <button onclick="liveMode.showAddSongModal()" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 8px;">
                            + Add Song
                        </button>
                    `;
                }
            } else {
                playlistContent.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Not in a session</p>';
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            playlistContent.innerHTML = '<p style="color: #ef4444; text-align: center;">Error loading playlist</p>';
        }
    },

    /**
     * Update playlist selection highlight without reloading data
     */
    updatePlaylistSelection() {
        const playlistContent = document.getElementById('liveModePlaylistContent');
        if (!playlistContent) return;

        const items = playlistContent.querySelectorAll('[onclick^="liveMode.loadSongFromPlaylist"]');
        items.forEach(item => {
            // Extract song ID from onclick
            const onclick = item.getAttribute('onclick');
            const match = onclick.match(/loadSongFromPlaylist\('([^']+)'\)/);
            if (!match) return;

            const songId = match[1];
            const isCurrent = songId === this.currentSongId;

            if (isCurrent) {
                item.style.background = 'rgba(139, 92, 246, 0.3)';
                item.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                // Update number color
                const numberSpan = item.querySelector('span');
                if (numberSpan) numberSpan.style.color = '#8b5cf6';
            } else {
                item.style.background = 'var(--button-bg)';
                item.style.borderColor = 'var(--border)';
                const numberSpan = item.querySelector('span');
                if (numberSpan) numberSpan.style.color = 'var(--text-muted)';
            }
        });
    },

    /**
     * Toggle metronome enabled for a specific song (auto-saves to session)
     */
    toggleSongMetronome(songId, enabled) {
        this.songMetronomeEnabled[songId] = enabled;
        // Auto-save to session preferences
        this.saveSongPreferences(songId, { metronomeEnabled: enabled });
        console.log(`🎵 Metronome ${enabled ? 'enabled' : 'disabled'} for song: ${songId}`);
    },

    /**
     * Toggle pad enabled for a specific song (auto-saves to session)
     */
    toggleSongPad(songId, enabled) {
        this.songPadEnabled[songId] = enabled;
        // Auto-save to session preferences
        this.saveSongPreferences(songId, { padEnabled: enabled });
        console.log(`🎹 Pad ${enabled ? 'enabled' : 'disabled'} for song: ${songId}`);
    },

    /**
     * Toggle auto-scroll enabled for a specific song (auto-saves to session)
     */
    toggleSongAutoScroll(songId, enabled) {
        this.songAutoScrollEnabled[songId] = enabled;
        // Auto-save to session preferences
        this.saveSongPreferences(songId, { autoScrollEnabled: enabled });
        console.log(`📜 Auto-scroll ${enabled ? 'enabled' : 'disabled'} for song: ${songId}`);
    },

    /**
     * Remove song from playlist (Leader only)
     */
    async removeSongFromPlaylist(songId) {
        if (!window.sessionManager || !window.sessionManager.isLeader) {
            console.log('Only leader can remove songs');
            return;
        }

        // Get song name for confirmation
        const playlist = await window.sessionManager.getPlaylist();
        const song = playlist.find(s => s.id === songId);
        const songName = song?.name || song?.title || 'this song';

        // Beautiful confirm dialog
        const confirmed = await window.showConfirm(`Remove "${songName}" from playlist?`, {
            icon: '🗑️',
            title: 'Remove Song',
            confirmText: 'Remove',
            cancelText: 'Keep',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await window.sessionManager.removeSongFromPlaylist(songId);
            console.log(`➖ Removed song from playlist: ${songId}`);
            // Refresh playlist display
            this.showPlaylist();
        } catch (error) {
            console.error('Error removing song from playlist:', error);
            if (window.showAlert) showAlert('Failed to remove song from playlist');
        }
    },

    /**
     * Show modal to add songs to playlist
     */
    async showAddSongModal() {
        if (!window.sessionManager || !window.sessionManager.isLeader) {
            console.log('Only leader can add songs');
            return;
        }

        // Create modal if it doesn't exist
        let modal = document.getElementById('liveAddSongModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'liveAddSongModal';
            modal.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10001; display: flex; align-items: center; justify-content: center; padding: 20px;">
                    <div style="background: var(--bg-secondary, #1a1a2e); border-radius: 12px; width: 100%; max-width: 450px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                        <div style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; color: var(--text); font-size: 16px;">Add Song to Playlist</h3>
                            <button onclick="liveMode.hideAddSongModal()" style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer; line-height: 1;">&times;</button>
                        </div>
                        <div style="padding: 12px; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                                <select id="liveAddSongSource" onchange="liveMode.loadAddSongList()" style="flex: 1; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--button-bg); color: var(--text); font-size: 13px; cursor: pointer;">
                                    <option value="my-songs">📁 My Songs</option>
                                    <option value="public">🌐 Public Songs</option>
                                </select>
                            </div>
                            <input type="text" id="liveAddSongSearch" placeholder="Search songs..." oninput="liveMode.filterAddSongList(this.value)"
                                   style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text); font-size: 14px; box-sizing: border-box;" />
                        </div>
                        <div id="liveAddSongList" style="flex: 1; overflow-y: auto; padding: 12px; min-height: 200px; max-height: 400px;">
                            <p style="color: var(--text-muted); text-align: center;">Loading songs...</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.style.display = 'block';

        // Reset search
        const searchInput = document.getElementById('liveAddSongSearch');
        if (searchInput) searchInput.value = '';

        // Load user's books into the source dropdown
        await this.loadBookOptions();

        // Load songs from library
        await this.loadAddSongList();
    },

    /**
     * Load user's books into the source dropdown
     */
    async loadBookOptions() {
        const sourceSelect = document.getElementById('liveAddSongSource');
        if (!sourceSelect) return;

        const user = window.auth?.currentUser;
        if (!user) return;

        try {
            // Keep the first two options (My Songs, Public Songs)
            const defaultOptions = `
                <option value="my-songs">📁 My Songs</option>
                <option value="public">🌐 Public Songs</option>
            `;

            // Get user's books
            const booksSnapshot = await firebase.database().ref(`users/${user.uid}/books`).once('value');
            const books = booksSnapshot.val() || {};

            let bookOptions = '';
            Object.entries(books).forEach(([bookId, book]) => {
                const bookName = book.name || 'Untitled Book';
                bookOptions += `<option value="book:${bookId}">📖 ${bookName}</option>`;
            });

            if (bookOptions) {
                sourceSelect.innerHTML = defaultOptions +
                    '<option disabled>──────────</option>' +
                    bookOptions;
            } else {
                sourceSelect.innerHTML = defaultOptions;
            }
        } catch (error) {
            console.error('Error loading books:', error);
        }
    },

    /**
     * Hide add song modal
     */
    hideAddSongModal() {
        const modal = document.getElementById('liveAddSongModal');
        if (modal) modal.style.display = 'none';
    },

    /**
     * Load songs from library into add song modal
     */
    async loadAddSongList(filter = '') {
        const listContainer = document.getElementById('liveAddSongList');
        const sourceSelect = document.getElementById('liveAddSongSource');
        if (!listContainer) return;

        // Get filter from search input if not passed
        if (!filter) {
            const searchInput = document.getElementById('liveAddSongSearch');
            filter = searchInput?.value || '';
        }

        const source = sourceSelect?.value || 'my-songs';
        listContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Loading songs...</p>';

        try {
            const user = window.auth?.currentUser;
            let allSongs = [];

            if (source === 'public') {
                // Load public songs
                const snapshot = await firebase.database().ref('public-songs').once('value');
                const publicSongs = snapshot.val() || {};
                allSongs = Object.entries(publicSongs).map(([id, data]) => ({
                    id: `public:${id}`,
                    name: data.title || data.name || 'Untitled',
                    originalKey: data.key || data.originalKey,
                    bpm: data.bpm || data.tempo,
                    isPublic: true,
                    ...data
                }));
                console.log(`🌐 Loaded ${allSongs.length} public songs`);

            } else if (source.startsWith('book:')) {
                // Load songs from a specific book
                const bookId = source.replace('book:', '');
                if (!user) {
                    listContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Please log in to access your books</p>';
                    return;
                }

                const bookSnapshot = await firebase.database().ref(`users/${user.uid}/books/${bookId}`).once('value');
                const book = bookSnapshot.val();

                if (book && book.songs) {
                    allSongs = Object.entries(book.songs).map(([id, data]) => ({
                        id: `book:${bookId}:${id}`,
                        name: data.title || data.name || 'Untitled',
                        originalKey: data.key || data.originalKey,
                        bpm: data.bpm || data.tempo,
                        bookId: bookId,
                        ...data
                    }));
                }
                console.log(`📖 Loaded ${allSongs.length} songs from book`);

            } else {
                // Load user's own songs (my-songs)
                if (!user) {
                    listContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Please log in to access your library</p>';
                    return;
                }

                const snapshot = await firebase.database().ref(`users/${user.uid}/songs`).once('value');
                const songs = snapshot.val() || {};
                allSongs = Object.entries(songs).map(([id, data]) => ({ id, ...data }));
                console.log(`📁 Loaded ${allSongs.length} songs from My Songs`);
            }

            // Check if source is empty
            if (allSongs.length === 0) {
                const emptyMessage = source === 'public'
                    ? 'No public songs available'
                    : source.startsWith('book:')
                        ? 'This book is empty'
                        : 'Your library is empty';
                listContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center;">${emptyMessage}</p>`;
                return;
            }

            // Get current playlist to exclude already added songs
            const playlist = await window.sessionManager.getPlaylist();
            const playlistIds = new Set(playlist.map(s => s.id));

            // Filter and sort songs
            let songList = allSongs
                .filter(song => !playlistIds.has(song.id)) // Exclude songs already in playlist
                .filter(song => !filter || (song.name || '').toLowerCase().includes(filter.toLowerCase()))
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            if (songList.length === 0) {
                listContainer.innerHTML = filter
                    ? '<p style="color: var(--text-muted); text-align: center;">No matching songs found</p>'
                    : '<p style="color: var(--text-muted); text-align: center;">All songs already in playlist</p>';
                return;
            }

            // Render song list with source indicator
            listContainer.innerHTML = songList.map(song => {
                const sourceIcon = song.isPublic ? '🌐' : song.bookId ? '📖' : '';
                return `
                <div onclick="liveMode.addSongToPlaylist('${song.id}')"
                     style="padding: 10px 12px; background: var(--button-bg); border: 1px solid var(--border); border-radius: 6px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s ease;"
                     onmouseover="this.style.background='var(--button-hover)'" onmouseout="this.style.background='var(--button-bg)'">
                    <div style="color: var(--text); font-size: 13px; font-weight: 500;">${sourceIcon} ${song.name || 'Untitled'}</div>
                    <div style="color: var(--text-muted); font-size: 11px; margin-top: 2px;">
                        ${song.originalKey || song.key || '--'} ${song.bpm || song.tempo ? `• ${song.bpm || song.tempo} BPM` : ''}
                    </div>
                </div>
            `}).join('');

        } catch (error) {
            console.error('Error loading songs:', error);
            listContainer.innerHTML = '<p style="color: #ef4444; text-align: center;">Error loading songs</p>';
        }
    },

    /**
     * Filter add song list based on search input
     */
    filterAddSongList(query) {
        this.loadAddSongList(query);
    },

    /**
     * Add a song to the playlist
     */
    async addSongToPlaylist(songId) {
        if (!window.sessionManager || !window.sessionManager.isLeader) {
            console.log('Only leader can add songs');
            return;
        }

        try {
            const user = window.auth?.currentUser;
            let songData = null;
            let dbPath = '';

            // Determine the source based on songId prefix
            if (songId.startsWith('public:')) {
                // Public song
                const actualId = songId.replace('public:', '');
                dbPath = `public-songs/${actualId}`;
                const snapshot = await firebase.database().ref(dbPath).once('value');
                songData = snapshot.val();
                if (songData) {
                    songData.name = songData.title || songData.name;
                    songData.originalKey = songData.key || songData.originalKey;
                    songData.bpm = songData.bpm || songData.tempo;
                }
            } else if (songId.startsWith('book:')) {
                // Book song (format: book:bookId:songId)
                const parts = songId.split(':');
                const bookId = parts[1];
                const actualSongId = parts[2];
                if (!user) return;
                dbPath = `users/${user.uid}/books/${bookId}/songs/${actualSongId}`;
                const snapshot = await firebase.database().ref(dbPath).once('value');
                songData = snapshot.val();
                if (songData) {
                    songData.name = songData.title || songData.name;
                    songData.originalKey = songData.key || songData.originalKey;
                    songData.bpm = songData.bpm || songData.tempo;
                }
            } else {
                // User's own song
                if (!user) return;
                dbPath = `users/${user.uid}/songs/${songId}`;
                const snapshot = await firebase.database().ref(dbPath).once('value');
                songData = snapshot.val();
            }

            if (!songData) {
                console.error('Song not found:', songId, 'at path:', dbPath);
                if (window.showAlert) showAlert('Song not found');
                return;
            }

            // Add to playlist
            await window.sessionManager.addSongToPlaylist({
                id: songId,
                name: songData.name || 'Untitled',
                title: songData.name || 'Untitled',
                content: songData.content || '',
                originalKey: songData.originalKey || songData.key || '',
                key: songData.originalKey || songData.key || '',
                bpm: songData.bpm || null
            });

            console.log(`➕ Added song to playlist: ${songData.name}`);

            // Refresh playlist and modal
            this.showPlaylist();
            this.loadAddSongList(document.getElementById('liveAddSongSearch')?.value || '');

        } catch (error) {
            console.error('Error adding song to playlist:', error);
            if (window.showAlert) showAlert('Failed to add song to playlist');
        }
    },

    /**
     * Convert key string (e.g., "C Major", "F# Minor") to pad player key format
     */
    convertKeyToPadKey(keyString) {
        if (!keyString) return null;

        // Extract the root note (e.g., "C", "F#", "Bb")
        const match = keyString.match(/^([A-G][#b]?)/i);
        if (!match) return null;

        let key = match[1].toUpperCase();

        // Handle flats - convert to sharps for pad player
        const flatToSharp = {
            'DB': 'Csharp', 'EB': 'Dsharp', 'GB': 'Fsharp',
            'AB': 'Gsharp', 'BB': 'Asharp'
        };

        // Check for flat notation
        if (key.includes('B') && key.length === 2 && key[0] !== 'B') {
            // It's a flat (e.g., "Db", "Eb")
            const flatKey = key.toUpperCase();
            if (flatToSharp[flatKey]) return flatToSharp[flatKey];
        }

        // Handle sharps
        if (key.includes('#')) {
            return key.replace('#', 'sharp');
        }

        // Plain note (A, B, C, D, E, F, G)
        return key;
    },

    /**
     * Get related keys for dropdown (relative major/minor + all keys)
     * Returns array of { value: 'C', label: 'C', isRelative: false }
     */
    getRelatedKeys(keyString) {
        const allKeys = ['C', 'Csharp', 'D', 'Dsharp', 'E', 'F', 'Fsharp', 'G', 'Gsharp', 'A', 'Asharp', 'B'];
        const displayLabels = { 'C': 'C', 'Csharp': 'C#', 'D': 'D', 'Dsharp': 'D#', 'E': 'E', 'F': 'F', 'Fsharp': 'F#', 'G': 'G', 'Gsharp': 'G#', 'A': 'A', 'Asharp': 'A#', 'B': 'B' };

        // Relative minor/major pairs (relative minor is 3 semitones down from major)
        const relativePairs = {
            'C': 'A', 'Csharp': 'Asharp', 'D': 'B', 'Dsharp': 'C', 'E': 'Csharp', 'F': 'D',
            'Fsharp': 'Dsharp', 'G': 'E', 'Gsharp': 'F', 'A': 'Fsharp', 'Asharp': 'G', 'B': 'Gsharp'
        };

        const detectedKey = this.convertKeyToPadKey(keyString);
        const isMinor = keyString && keyString.toLowerCase().includes('minor');

        // Get relative key (if major → relative minor root, if minor → relative major root)
        let relativeKey = null;
        if (detectedKey) {
            if (isMinor) {
                // Find major key that has this as relative minor
                relativeKey = Object.keys(relativePairs).find(k => relativePairs[k] === detectedKey);
            } else {
                relativeKey = relativePairs[detectedKey];
            }
        }

        const result = [];

        // Add detected key first (if exists)
        if (detectedKey) {
            result.push({ value: detectedKey, label: `${displayLabels[detectedKey]} ✓`, isDetected: true });
        }

        // Add relative key second (if exists and different)
        if (relativeKey && relativeKey !== detectedKey) {
            result.push({ value: relativeKey, label: `${displayLabels[relativeKey]} (rel)`, isRelative: true });
        }

        // Add all other keys
        allKeys.forEach(key => {
            if (key !== detectedKey && key !== relativeKey) {
                result.push({ value: key, label: displayLabels[key], isDetected: false, isRelative: false });
            }
        });

        return result;
    },

    /**
     * Handle pad key selection change from dropdown (auto-saves to session)
     */
    changeSongPadKey(songId, newKey) {
        this.songPadKey[songId] = newKey;
        // Also enable pad if a key is selected
        if (newKey) {
            this.songPadEnabled[songId] = true;
        }
        // Auto-save to session preferences
        this.saveSongPreferences(songId, { padKey: newKey, padEnabled: !!newKey });
        console.log(`🎹 Pad key changed for song ${songId}: ${newKey}`);

        // If this is the current song and pad is playing, switch to new key
        if (songId === this.currentSongId && this.songPadEnabled[songId] && window.padPlayer) {
            window.padPlayer.play(newKey); // Auto crossfades
        }
    },

    /**
     * Sync mini audio controls (metronome & pad) with current state
     */
    syncMiniAudioControls() {
        // Sync metronome BPM
        const bpmDisplay = document.getElementById('liveMetroBpm');
        if (bpmDisplay && window.metronome) {
            bpmDisplay.textContent = window.metronome.bpm || 120;
        }

        // Sync metronome play button
        const metroPlayBtn = document.getElementById('liveMetroPlay');
        if (metroPlayBtn && window.metronome) {
            metroPlayBtn.textContent = window.metronome.isPlaying ? '⏸' : '▶';
            metroPlayBtn.style.background = window.metronome.isPlaying
                ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                : 'linear-gradient(135deg, #d97706, #f59e0b)';
        }

        // Sync pad key display
        const padKeyDisplay = document.getElementById('livePadKey');
        if (padKeyDisplay && window.padPlayer) {
            const playingKeys = window.padPlayer.getPlayingKeys ? window.padPlayer.getPlayingKeys() : [];
            padKeyDisplay.textContent = playingKeys.length > 0 ? playingKeys[0].replace('sharp', '#') : '--';
        }

        // Update pad stop button style
        const padStopBtn = document.getElementById('livePadStop');
        if (padStopBtn && window.padPlayer) {
            const isPlaying = window.padPlayer.getPlayingKeys && window.padPlayer.getPlayingKeys().length > 0;
            padStopBtn.style.background = isPlaying
                ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                : 'linear-gradient(135deg, #7c3aed, #a855f7)';
        }
    },

    /**
     * Start interval to sync mini audio controls
     */
    startMiniAudioSync() {
        // Clear any existing interval
        if (this.miniAudioSyncInterval) {
            clearInterval(this.miniAudioSyncInterval);
        }

        // Sync every 200ms while Live Mode is active
        this.miniAudioSyncInterval = setInterval(() => {
            if (this.isActive) {
                this.syncMiniAudioControls();
            } else {
                clearInterval(this.miniAudioSyncInterval);
            }
        }, 200);
    },

    /**
     * Hide playlist sidebar
     */
    hidePlaylist() {
        const playlistSidebar = document.getElementById('liveModePlaylistSidebar');

        if (playlistSidebar) {
            playlistSidebar.style.right = '-300px';
            this.sidebarVisible = false;
        }
    },

    /**
     * Copy session join link to clipboard
     */
    async copySessionLink() {
        const sessionCode = window.sessionManager?.activeSessionCode;
        if (!sessionCode) return;

        const joinUrl = `${window.location.origin}${window.location.pathname}?join=${sessionCode.replace('-', '')}`;

        try {
            await navigator.clipboard.writeText(joinUrl);
            this.showToast('Link copied!');
        } catch (err) {
            console.error('Failed to copy link:', err);
            // Fallback
            prompt('Copy this link:', joinUrl);
        }
    },

    /**
     * Copy session code to clipboard
     */
    async copySessionCode() {
        const sessionCode = window.sessionManager?.activeSessionCode;
        if (!sessionCode) return;

        try {
            await navigator.clipboard.writeText(sessionCode);
            this.showToast('Code copied!');
        } catch (err) {
            console.error('Failed to copy code:', err);
            prompt('Copy this code:', sessionCode);
        }
    },

    /**
     * Show a toast notification
     */
    showToast(message) {
        // Remove existing toast
        const existing = document.querySelector('.live-mode-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'live-mode-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 99999;
            animation: fadeInOut 2s ease forwards;
        `;

        // Add animation style if not exists
        if (!document.getElementById('toast-animation')) {
            const style = document.createElement('style');
            style.id = 'toast-animation';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    },

    /**
     * Open the session manager modal
     * @param {string} providedSessionId - Optional session ID (for managing from My Sessions list)
     */
    async openSessionManager(providedSessionId = null) {
        const modal = document.getElementById('sessionManagerModal');
        if (!modal) return;

        // Use provided sessionId or fall back to active session
        const sessionId = providedSessionId || window.sessionManager?.activeSession;
        if (!sessionId) return;

        // Store for use in other functions (like removeParticipant, endSession)
        this._managingSessionId = sessionId;

        // Get session code from metadata if not active session
        let sessionCode = window.sessionManager?.activeSessionCode;
        if (providedSessionId && providedSessionId !== window.sessionManager?.activeSession) {
            try {
                const codeSnapshot = await firebase.database().ref(`sessions/${sessionId}/metadata/sessionCode`).once('value');
                sessionCode = codeSnapshot.val();
            } catch (err) {
                console.error('Error getting session code:', err);
            }
        }

        // Update session code display
        const codeEl = document.getElementById('sessionManagerCode');
        if (codeEl) codeEl.textContent = sessionCode || sessionId;

        // Generate and display singer link (keep the dash - Firebase stores code with dash)
        const singerLinkEl = document.getElementById('sessionManagerSingerLink');
        if (singerLinkEl && sessionCode) {
            const baseUrl = `${window.location.origin}${window.location.pathname}`;
            const singerLink = `${baseUrl}?singer=${sessionCode}`;
            singerLinkEl.value = singerLink;
        }

        // Get session metadata for title and allowSingers
        try {
            const sessionSnapshot = await firebase.database().ref(`sessions/${sessionId}/metadata`).once('value');
            const metadata = sessionSnapshot.val();
            const titleEl = document.getElementById('sessionManagerTitle');
            if (titleEl && metadata) {
                titleEl.textContent = metadata.title || 'Live Session';
            }

            // Update allowSingers toggle and visibility
            const allowSingersToggle = document.getElementById('allowSingersToggle');
            const singerLinkSection = document.getElementById('singerLinkSection');
            const singerLinkDisabled = document.getElementById('singerLinkDisabled');
            const allowSingers = metadata?.allowSingers || false;

            if (allowSingersToggle) allowSingersToggle.checked = allowSingers;
            if (singerLinkSection) singerLinkSection.style.display = allowSingers ? 'block' : 'none';
            if (singerLinkDisabled) singerLinkDisabled.style.display = allowSingers ? 'none' : 'block';
        } catch (err) {
            console.error('Error loading session metadata:', err);
        }

        // Load participants
        await this.loadSessionParticipants();

        // Show modal
        modal.style.display = 'flex';

        // Start listening for participant changes
        this.listenToParticipants();
    },

    /**
     * Copy singer link to clipboard
     */
    async copySingerLink() {
        const singerLinkEl = document.getElementById('sessionManagerSingerLink');
        if (!singerLinkEl || !singerLinkEl.value) return;

        try {
            await navigator.clipboard.writeText(singerLinkEl.value);
            this.showToast('🎤 Singer link copied!');
        } catch (err) {
            console.error('Failed to copy singer link:', err);
            singerLinkEl.select();
            document.execCommand('copy');
            this.showToast('🎤 Singer link copied!');
        }
    },

    /**
     * Close the session manager modal
     */
    closeSessionManager() {
        const modal = document.getElementById('sessionManagerModal');
        if (modal) modal.style.display = 'none';

        // Stop listening to participants
        if (this.participantsListener) {
            this.participantsListener.off();
            this.participantsListener = null;
        }

        // Clear managed session ID
        this._managingSessionId = null;
    },

    /**
     * Toggle allow singers setting
     */
    async toggleAllowSingers(allowed) {
        const sessionId = this._managingSessionId || window.sessionManager?.activeSession;
        if (!sessionId) return;

        try {
            await firebase.database().ref(`sessions/${sessionId}/metadata/allowSingers`).set(allowed);

            // Update UI
            const singerLinkSection = document.getElementById('singerLinkSection');
            const singerLinkDisabled = document.getElementById('singerLinkDisabled');
            if (singerLinkSection) singerLinkSection.style.display = allowed ? 'block' : 'none';
            if (singerLinkDisabled) singerLinkDisabled.style.display = allowed ? 'none' : 'block';

            this.showToast(allowed ? '🎤 Singers enabled' : '🎤 Singers disabled');
        } catch (err) {
            console.error('Error toggling allow singers:', err);
            this.showToast('Failed to update setting');
        }
    },

    /**
     * Load and display session participants
     */
    async loadSessionParticipants() {
        const sessionId = this._managingSessionId || window.sessionManager?.activeSession;
        console.log('📋 loadSessionParticipants - sessionId:', sessionId);
        if (!sessionId) return;

        const listEl = document.getElementById('participantsList');
        if (!listEl) return;

        try {
            const snapshot = await firebase.database().ref(`sessions/${sessionId}/participants`).once('value');
            const participants = snapshot.val() || {};
            console.log('📋 Participants from Firebase:', participants);
            const metadataSnapshot = await firebase.database().ref(`sessions/${sessionId}/metadata`).once('value');
            const metadata = metadataSnapshot.val() || {};
            const leaderId = metadata.leaderId;
            console.log('📋 Leader ID:', leaderId);

            this.renderParticipants(participants, leaderId);
        } catch (err) {
            console.error('Error loading participants:', err);
            listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Error loading participants</div>';
        }
    },

    /**
     * Listen to participant changes in real-time
     */
    listenToParticipants() {
        const sessionId = this._managingSessionId || window.sessionManager?.activeSession;
        if (!sessionId) return;

        // Stop any existing listener
        if (this.participantsListener) {
            this.participantsListener.off();
        }

        this.participantsListener = firebase.database().ref(`sessions/${sessionId}/participants`);
        this.participantsListener.on('value', async (snapshot) => {
            const participants = snapshot.val() || {};
            const metadataSnapshot = await firebase.database().ref(`sessions/${sessionId}/metadata`).once('value');
            const metadata = metadataSnapshot.val() || {};
            const leaderId = metadata.leaderId;
            this.renderParticipants(participants, leaderId);
        });
    },

    /**
     * Render participants list
     */
    renderParticipants(participants, leaderId) {
        const listEl = document.getElementById('participantsList');
        const countEl = document.getElementById('participantCount');
        if (!listEl) return;

        const participantArray = Object.entries(participants);
        if (countEl) countEl.textContent = `(${participantArray.length})`;

        if (participantArray.length === 0) {
            listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No participants yet</div>';
            return;
        }

        const currentUserId = window.auth?.currentUser?.uid;
        // Check if current user is the leader (works for both active session and My Sessions view)
        const isLeader = currentUserId === leaderId || window.sessionManager?.isLeader;

        listEl.innerHTML = participantArray.map(([uid, participantData]) => {
            const isThisLeader = uid === leaderId;
            const isMe = uid === currentUserId;
            const isSinger = participantData.type === 'singer';

            let roleIcon = '👤';
            let roleBadge = '';
            let avatarBg = 'rgba(100, 100, 100, 0.2)';
            let avatarBorder = 'rgba(100, 100, 100, 0.3)';

            if (isThisLeader) {
                roleIcon = '👑';
                roleBadge = '<span style="font-size: 10px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Leader</span>';
                avatarBg = 'rgba(245, 158, 11, 0.2)';
                avatarBorder = 'rgba(245, 158, 11, 0.4)';
            } else if (isSinger) {
                roleIcon = '🎤';
                roleBadge = '<span style="font-size: 10px; background: rgba(139, 92, 246, 0.2); color: #8b5cf6; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Singer</span>';
                avatarBg = 'rgba(139, 92, 246, 0.2)';
                avatarBorder = 'rgba(139, 92, 246, 0.4)';
            } else {
                roleBadge = '<span style="font-size: 10px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">Player</span>';
                avatarBg = 'rgba(59, 130, 246, 0.2)';
                avatarBorder = 'rgba(59, 130, 246, 0.4)';
            }

            const meLabel = isMe ? ' <span style="font-size: 10px; opacity: 0.6;">(you)</span>' : '';

            // Only leader can remove participants (but not themselves)
            const removeBtn = (isLeader && !isThisLeader && !isMe)
                ? `<button onclick="liveMode.removeParticipant('${uid}')" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 14px;">✕</button>`
                : '';

            return `
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--border);">
                    <div style="width: 36px; height: 36px; background: ${avatarBg}; border: 1px solid ${avatarBorder}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                        ${roleIcon}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${participantData.name || 'Anonymous'}${meLabel}
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                            ${roleBadge}
                        </div>
                    </div>
                    ${removeBtn}
                </div>
            `;
        }).join('');
    },

    /**
     * Remove a participant from the session
     */
    async removeParticipant(uid) {
        const sessionId = this._managingSessionId || window.sessionManager?.activeSession;
        if (!sessionId) return;

        // Check if current user is the leader
        const currentUserId = window.auth?.currentUser?.uid;
        const metadataSnapshot = await firebase.database().ref(`sessions/${sessionId}/metadata/leaderId`).once('value');
        const leaderId = metadataSnapshot.val();

        if (currentUserId !== leaderId) {
            this.showToast('Only the leader can remove participants');
            return;
        }

        if (!confirm('Remove this participant from the session?')) return;

        try {
            await firebase.database().ref(`sessions/${sessionId}/participants/${uid}`).remove();
            this.showToast('Participant removed');
        } catch (err) {
            console.error('Error removing participant:', err);
            this.showToast('Failed to remove participant');
        }
    },

    /**
     * End the current session
     */
    async endSession() {
        const sessionId = this._managingSessionId || window.sessionManager?.activeSession;
        if (!sessionId) return;

        // Check if current user is the leader
        const currentUserId = window.auth?.currentUser?.uid;
        const metadataSnapshot = await firebase.database().ref(`sessions/${sessionId}/metadata/leaderId`).once('value');
        const leaderId = metadataSnapshot.val();

        if (currentUserId !== leaderId) {
            this.showToast('Only the leader can end the session');
            return;
        }

        if (!confirm('End this session? All participants will be disconnected.')) return;

        try {
            await firebase.database().ref(`sessions/${sessionId}/metadata/status`).set('ended');
            this.closeSessionManager();
            this.showToast('Session ended');

            // Only cleanup if this is the active session
            if (sessionId === window.sessionManager?.activeSession) {
                window.sessionManager.cleanup();
                this.closeLiveMode();
            }

            // Refresh session list if My Sessions modal is open
            if (window.sessionUI) {
                window.sessionUI.loadUserSessions();
            }
        } catch (err) {
            console.error('Error ending session:', err);
            this.showToast('Failed to end session');
        }
    },

    /**
     * Load a song from the playlist
     * @param {string} songId - Song ID to load
     */
    async loadSongFromPlaylist(songId) {
        try {
            if (!window.sessionManager || !window.sessionManager.activeSession) return;

            // Get song data from Firebase
            const sessionId = window.sessionManager.activeSession;
            const snapshot = await firebase.database().ref(`sessions/${sessionId}/playlist/${songId}`).once('value');
            const songData = snapshot.val();

            if (!songData) {
                console.error('Song not found in playlist');
                return;
            }

            // Load into editor
            const visualEditor = document.getElementById('visualEditor');
            const keySelector = document.getElementById('keySelector');
            const songbookOutput = document.getElementById('songbookOutput');
            const livePreview = document.getElementById('livePreview');

            if (visualEditor) {
                visualEditor.value = songData.content || '';
                // Apply RTL/LTR direction based on content
                if (window.setDirectionalLayout) {
                    window.setDirectionalLayout(visualEditor, songData.content);
                }
            }

            // Also reset direction for songbook output and live preview
            if (songbookOutput && window.setDirectionalLayout) {
                window.setDirectionalLayout(songbookOutput, songData.content);
            }
            if (livePreview && window.setDirectionalLayout) {
                window.setDirectionalLayout(livePreview, songData.content);
            }

            if (keySelector && (songData.key || songData.originalKey)) {
                const normalizedKey = window.normalizeKey ? window.normalizeKey(songData.key || songData.originalKey) : (songData.key || songData.originalKey);
                keySelector.value = normalizedKey;
            }

            // ✅ UPDATE LIVE MODE STATE WITH NEW STRUCTURED FIELDS
            this.currentSongContent = songData.content || '';
            this.currentKey = window.normalizeKey ? window.normalizeKey(songData.key || songData.originalKey) : (songData.key || songData.originalKey || 'C Major');
            this.currentSongId = songId;
            this.currentTransposeSteps = 0;
            this.resetSectionIndex(); // Reset MIDI section navigation

            // Build display name from structured fields
            const title = songData.title || songData.name || 'Untitled';
            const author = songData.author ? ` - ${songData.author}` : '';
            const bpmInfo = songData.bpm ? ` | ${songData.bpm} BPM` : '';
            const timeInfo = songData.timeSignature ? ` | ${songData.timeSignature}` : '';
            this.currentSongName = `${title}${author}${bpmInfo}${timeInfo}`;

            // Load per-song preferences from session (or use song defaults for first load)
            const savedPrefs = await this.loadSongPreferences(songId);
            if (savedPrefs) {
                console.log(`📺 Loaded session preferences for ${songId}:`, savedPrefs);

                // Apply font size
                if (savedPrefs.fontSize) {
                    this.currentFontSize = savedPrefs.fontSize;
                }

                // Apply columns
                if (savedPrefs.columns) {
                    this.currentColumnLayout = savedPrefs.columns;
                }

                // Apply transpose
                if (savedPrefs.transposeSteps && savedPrefs.transposeSteps !== 0) {
                    for (let i = 0; i < Math.abs(savedPrefs.transposeSteps); i++) {
                        this.transpose(savedPrefs.transposeSteps > 0 ? 1 : -1);
                    }
                }

                // Apply showBorders preference
                if (typeof savedPrefs.showBorders === 'boolean') {
                    this.showBorders = savedPrefs.showBorders;
                    const bordersCheckbox = document.getElementById('liveModeBorders');
                    if (bordersCheckbox) bordersCheckbox.checked = savedPrefs.showBorders;
                }

                // Apply metronome preference
                if (typeof savedPrefs.metronomeEnabled === 'boolean') {
                    this.songMetronomeEnabled[songId] = savedPrefs.metronomeEnabled;
                }

                // Apply pad preferences
                if (typeof savedPrefs.padEnabled === 'boolean') {
                    this.songPadEnabled[songId] = savedPrefs.padEnabled;
                }
                if (savedPrefs.padKey) {
                    this.songPadKey[songId] = savedPrefs.padKey;
                }

                // Apply auto-scroll preference (per-song tracking)
                if (typeof savedPrefs.autoScrollEnabled === 'boolean') {
                    this.songAutoScrollEnabled[songId] = savedPrefs.autoScrollEnabled;
                }
            } else {
                // FIRST TIME loading this song in session - use song's own settings
                console.log(`📺 First load for ${songId}, using song defaults`);

                // Use song's stored layout settings
                if (songData.fontSize) {
                    this.currentFontSize = songData.fontSize;
                }
                if (songData.columnCount) {
                    this.currentColumnLayout = parseInt(songData.columnCount) || 2;
                }

                // Start at original key (no transpose)
                this.currentTransposeSteps = 0;

                // Defaults for new preferences
                this.songMetronomeEnabled[songId] = false;
                this.songPadEnabled[songId] = false;
                this.songPadKey[songId] = null;
                this.songAutoScrollEnabled[songId] = false;
            }

            // Update display
            this.updateDisplay();

            // Apply per-song preferences after display update
            const chartDisplay = document.getElementById('liveModeChartDisplay');
            if (chartDisplay) {
                if (this.currentFontSize) {
                    chartDisplay.style.fontSize = this.currentFontSize + 'pt';
                }
                // Apply borders preference
                if (this.showBorders) {
                    chartDisplay.classList.remove('hide-borders');
                } else {
                    chartDisplay.classList.add('hide-borders');
                }
            }
            const zoomValue = document.getElementById('liveModeZoomValue');
            if (zoomValue) zoomValue.textContent = (this.currentFontSize || 14) + 'pt';

            // Apply column layout if not in Full Overview mode
            if (!this.fullOverviewMode && this.currentColumnLayout) {
                this.setColumnLayout(this.currentColumnLayout);
            }

            // Initialize auto-scroll for this song (pass duration from song data if available)
            await this.initAutoScrollForSong(songId, songData.duration);

            // Hide playlist (if auto-hide is enabled) or update selection highlight
            if (this.autoHidePlaylist) {
                this.hidePlaylist();
            } else if (this.sidebarVisible) {
                // Update selection highlight without reloading
                this.updatePlaylistSelection();
            }

            // If leader, broadcast the song
            if (window.sessionManager.isLeader) {
                await window.sessionManager.updateCurrentSong({
                    id: songId,
                    name: songData.name,
                    content: songData.content,
                    originalKey: songData.originalKey,
                    bpm: songData.bpm
                });
            }

            // Update globals
            window.currentSongName = songData.name;
            window.currentSongId = songId;

            console.log(`📺 Loaded song: ${songData.name}`);

            // Handle Metronome auto-start based on checkbox
            if (this.songMetronomeEnabled[songId] && songData.bpm && window.metronome) {
                window.metronome.setBpm(parseInt(songData.bpm));
                window.metronome.start();
                console.log(`🎵 Metronome started at ${songData.bpm} BPM`);
            } else if (window.metronome && window.metronome.isPlaying) {
                window.metronome.stop();
                console.log(`🎵 Metronome stopped`);
            }

            // Handle Pad auto-start with crossfade based on checkbox
            // Use selected key from dropdown, or fall back to detected key
            const detectedKey = songData.originalKey || songData.key;
            const detectedPadKey = this.convertKeyToPadKey(detectedKey);
            const padKey = this.songPadKey[songId] || detectedPadKey;
            if (this.songPadEnabled[songId] && padKey && window.padPlayer) {
                window.padPlayer.play(padKey); // Auto crossfades from previous key
                console.log(`🎹 Pad started in key: ${padKey}`);
            } else if (!this.songPadEnabled[songId] && window.padPlayer) {
                window.padPlayer.stopAll(); // Fade out if disabled
                console.log(`🎹 Pad stopped`);
            }

            // Handle Auto-scroll auto-start based on checkbox
            if (this.songAutoScrollEnabled[songId]) {
                this.startAutoScroll();
                console.log(`📜 Auto-scroll started for song: ${songId}`);
            } else if (this.autoScrollEnabled) {
                this.stopAutoScroll();
                console.log(`📜 Auto-scroll stopped`);
            }

        } catch (error) {
            console.error('Error loading song from playlist:', error);
        }
    },

    /**
     * Update with new song data (called when receiving broadcast from leader)
     * @param {object} songData - Song data from leader
     */
    async updateFromBroadcast(songData) {
        console.log('📺 updateFromBroadcast called, isActive:', this.isActive, 'songData:', songData?.name);
        if (!this.isActive) {
            console.log('📺 Live Mode not active, skipping update');
            return;
        }

        // ✅ USE NEW STRUCTURED METADATA FIELDS
        this.currentSongContent = songData.content || '';
        this.currentKey = window.normalizeKey ? window.normalizeKey(songData.key || songData.originalKey) : (songData.key || songData.originalKey || 'C Major');
        this.currentSongId = songData.songId;
        this.currentTransposeSteps = 0;

        // Build display name from structured fields
        const title = songData.title || songData.name || 'Untitled';
        const author = songData.author ? ` - ${songData.author}` : '';
        const bpmInfo = songData.bpm ? ` | ${songData.bpm} BPM` : '';
        const timeInfo = songData.timeSignature ? ` | ${songData.timeSignature}` : '';
        this.currentSongName = `${title}${author}${bpmInfo}${timeInfo}`;

        console.log('📺 Content length:', this.currentSongContent.length);

        // Load player's per-song session preferences
        const savedPrefs = await this.loadSongPreferences(songData.songId);
        if (savedPrefs) {
            console.log(`📺 Loaded session preferences for ${songData.songId}:`, savedPrefs);

            // Apply font size
            if (savedPrefs.fontSize) {
                this.currentFontSize = savedPrefs.fontSize;
            }

            // Apply column layout
            if (savedPrefs.columns) {
                this.currentColumnLayout = savedPrefs.columns;
            }

            // Apply transpose
            if (savedPrefs.transposeSteps && savedPrefs.transposeSteps !== 0) {
                if (typeof window.transposeChart === 'function') {
                    this.currentSongContent = window.transposeChart(this.currentSongContent, savedPrefs.transposeSteps);
                    this.currentKey = this.calculateNewKey(this.currentKey, savedPrefs.transposeSteps);
                    this.currentTransposeSteps = savedPrefs.transposeSteps;
                }
            }

            // Apply showBorders preference
            if (typeof savedPrefs.showBorders === 'boolean') {
                this.showBorders = savedPrefs.showBorders;
                const bordersCheckbox = document.getElementById('liveModeBorders');
                if (bordersCheckbox) bordersCheckbox.checked = savedPrefs.showBorders;
            }

            // Apply metronome preference
            if (typeof savedPrefs.metronomeEnabled === 'boolean') {
                this.songMetronomeEnabled[songData.songId] = savedPrefs.metronomeEnabled;
            }

            // Apply pad preferences
            if (typeof savedPrefs.padEnabled === 'boolean') {
                this.songPadEnabled[songData.songId] = savedPrefs.padEnabled;
            }
            if (savedPrefs.padKey) {
                this.songPadKey[songData.songId] = savedPrefs.padKey;
            }

            // Apply auto-scroll preference (per-song tracking)
            if (typeof savedPrefs.autoScrollEnabled === 'boolean') {
                this.songAutoScrollEnabled[songData.songId] = savedPrefs.autoScrollEnabled;
            }
        } else {
            // FIRST TIME - use defaults from song data
            if (songData.fontSize) {
                this.currentFontSize = songData.fontSize;
            }
            if (songData.columnCount) {
                this.currentColumnLayout = parseInt(songData.columnCount) || 2;
            }
            // Start at original key
            this.currentTransposeSteps = 0;
            // Defaults for other preferences
            this.songMetronomeEnabled[songData.songId] = false;
            this.songPadEnabled[songData.songId] = false;
            this.songPadKey[songData.songId] = null;
            this.songAutoScrollEnabled[songData.songId] = false;
        }

        // Update display
        this.updateDisplay();

        // Apply per-song preferences after display update
        const chartDisplay = document.getElementById('liveModeChartDisplay');
        if (chartDisplay) {
            if (this.currentFontSize) {
                chartDisplay.style.fontSize = this.currentFontSize + 'pt';
            }
            // Apply column layout
            if (this.currentColumnLayout) {
                chartDisplay.style.columnCount = this.currentColumnLayout;
                chartDisplay.style.columnGap = '2em';
            }
            // Apply borders preference
            if (this.showBorders) {
                chartDisplay.classList.remove('hide-borders');
            } else {
                chartDisplay.classList.add('hide-borders');
            }
        }
        const zoomValue = document.getElementById('liveModeZoomValue');
        if (zoomValue) zoomValue.textContent = (this.currentFontSize || 14) + 'pt';

        // Update column layout buttons
        document.querySelectorAll('.column-layout-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.columns) === this.currentColumnLayout);
        });

        // Refresh playlist sidebar if visible (to update Leader indicator)
        console.log('📺 Checking playlist refresh, sidebarVisible:', this.sidebarVisible);
        if (this.sidebarVisible) {
            console.log('📺 Refreshing playlist sidebar');
            this.showPlaylist();
        }

        // Initialize auto-scroll for this song
        await this.initAutoScrollForSong(songData.songId, songData.duration);

        // Handle Metronome auto-start based on checkbox
        if (this.songMetronomeEnabled[songData.songId] && songData.bpm && window.metronome) {
            window.metronome.setBpm(parseInt(songData.bpm));
            window.metronome.start();
            console.log(`🎵 Metronome started at ${songData.bpm} BPM`);
        } else if (window.metronome && window.metronome.isPlaying) {
            window.metronome.stop();
            console.log(`🎵 Metronome stopped`);
        }

        // Handle Pad auto-start with crossfade based on checkbox
        const detectedKey = songData.originalKey || songData.key;
        const detectedPadKey = this.convertKeyToPadKey(detectedKey);
        const padKey = this.songPadKey[songData.songId] || detectedPadKey;
        if (this.songPadEnabled[songData.songId] && padKey && window.padPlayer) {
            window.padPlayer.play(padKey);
            console.log(`🎹 Pad started in key: ${padKey}`);
        } else if (!this.songPadEnabled[songData.songId] && window.padPlayer) {
            window.padPlayer.stopAll();
            console.log(`🎹 Pad stopped`);
        }

        // Handle Auto-scroll auto-start based on checkbox
        if (this.songAutoScrollEnabled[songData.songId]) {
            this.startAutoScroll();
            console.log(`📜 Auto-scroll started for song: ${songData.songId}`);
        } else if (this.autoScrollEnabled) {
            this.stopAutoScroll();
            console.log(`📜 Auto-scroll stopped`);
        }

        console.log(`📺 Live Mode updated: ${songData.name}`);
    },

    /**
     * Attach click handlers to section blocks (leader only)
     */
    attachSectionClickHandlers() {
        const sectionBlocks = document.querySelectorAll('.song-section-block');
        sectionBlocks.forEach(block => {
            // Remove any existing click handlers to prevent duplicates
            const newBlock = block.cloneNode(true);
            block.parentNode.replaceChild(newBlock, block);

            // Add click handler to the new node
            newBlock.style.cursor = 'pointer';
            newBlock.addEventListener('click', (e) => {
                e.stopPropagation();
                const sectionId = newBlock.dataset.sectionId;
                const sectionName = newBlock.dataset.sectionName;
                console.log(`🎯 Section clicked: ${sectionName} (ID: ${sectionId})`);
                this.selectSection(sectionId, sectionName);
            });
        });
    },

    /**
     * Select a section (leader broadcasts to all participants)
     */
    selectSection(sectionId, sectionName) {
        if (!window.sessionManager || !window.sessionManager.isLeader) return;

        console.log(`📍 Leader selected section: ${sectionName}`);

        // Show highlight on leader's screen immediately
        this.highlightSection(sectionId);

        // Broadcast selection to all participants
        window.sessionManager.updateSelectedSection(sectionId, sectionName);
    },

    /**
     * Highlight a selected section (called for all users)
     */
    highlightSection(sectionId) {
        // Remove previous highlights and animations
        document.querySelectorAll('.song-section-block').forEach(block => {
            block.classList.remove('section-selected');
            block.classList.remove('section-selected-static');
            block.style.removeProperty('border');
            block.style.removeProperty('background');
            block.style.removeProperty('box-shadow');
        });

        // Add highlight to selected section
        if (sectionId) {
            const selectedBlock = document.querySelector(`[data-section-id="${sectionId}"]`);
            if (selectedBlock) {
                const chartDisplay = document.getElementById('liveModeChartDisplay');
                const bordersHidden = chartDisplay && chartDisplay.classList.contains('hide-borders');

                if (bordersHidden) {
                    // Use inline styles for glow animation when borders are hidden
                    let glowCount = 0;
                    const glowInterval = setInterval(() => {
                        if (glowCount % 2 === 0) {
                            // Bright glow - very visible in both themes
                            selectedBlock.style.border = '3px solid #a855f7';
                            selectedBlock.style.background = 'rgba(168, 85, 247, 0.4)';
                            selectedBlock.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.8), 0 0 50px rgba(168, 85, 247, 0.4)';
                        } else {
                            // Dim glow
                            selectedBlock.style.border = '3px solid rgba(168, 85, 247, 0.6)';
                            selectedBlock.style.background = 'rgba(168, 85, 247, 0.2)';
                            selectedBlock.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.5)';
                        }
                        glowCount++;
                        if (glowCount >= 4) {
                            clearInterval(glowInterval);
                            // Fade out
                            selectedBlock.style.border = 'none';
                            selectedBlock.style.background = 'transparent';
                            selectedBlock.style.boxShadow = 'none';
                        }
                    }, 500);
                } else {
                    // Normal CSS animation when borders are visible
                    selectedBlock.classList.add('section-selected');

                    // After 2 seconds, switch to static border
                    setTimeout(() => {
                        selectedBlock.classList.remove('section-selected');
                        selectedBlock.classList.add('section-selected-static');
                    }, 2000);
                }

                // Scroll to section if needed
                selectedBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },

    /**
     * Apply saved user preferences from Firebase to Live Mode display
     */
    async applySavedPreferences(chartDisplay) {
        // Skip if in Full Overview mode - it has its own layout
        if (this.fullOverviewMode) return;

        if (!chartDisplay) return;

        // In Live Mode, use the CURRENT column layout set by user (not Firebase printPreviewPreferences)
        // This ensures column selection persists when changing songs
        const columns = this.currentColumnLayout || 2;
        const A4_HEIGHT_PX = 1123;

        chartDisplay.style.columns = columns.toString();
        chartDisplay.style.columnFill = 'auto';
        chartDisplay.style.height = A4_HEIGHT_PX + 'px';

        if (columns > 1) {
            chartDisplay.style.columnGap = '20px';
            chartDisplay.style.columnRule = '1px solid rgba(0, 0, 0, 0.2)';
        } else {
            chartDisplay.style.columnGap = '0px';
            chartDisplay.style.columnRule = 'none';
        }

        // Update layout buttons to reflect current state
        this.updateLayoutButtons();

        console.log(`✅ Applied Live Mode column layout: ${columns} column(s)`);
    },

    // ============== MIDI Controller Integration ==============

    // Track current section index for MIDI navigation
    currentSectionIndex: -1,

    /**
     * Navigate between song sections (VERSE, CHORUS, etc.)
     * @param {number} direction - 1 for next section, -1 for previous section
     */
    navigateSection(direction) {
        const sectionBlocks = document.querySelectorAll('.song-section-block');

        if (sectionBlocks.length === 0) {
            console.log('🎵 No sections found in current song');
            return;
        }

        // Calculate new index
        let newIndex = this.currentSectionIndex + direction;

        // Wrap around
        if (newIndex < 0) {
            newIndex = sectionBlocks.length - 1;
        } else if (newIndex >= sectionBlocks.length) {
            newIndex = 0;
        }

        this.currentSectionIndex = newIndex;
        const targetSection = sectionBlocks[newIndex];

        if (targetSection) {
            const sectionId = targetSection.dataset.sectionId;
            const sectionName = targetSection.dataset.sectionName || 'Section';

            // Use existing selectSection for highlighting and scrolling
            this.selectSection(sectionId, sectionName);

            console.log(`🎵 MIDI: ${direction > 0 ? 'Next' : 'Previous'} section - ${sectionName} (${newIndex + 1}/${sectionBlocks.length})`);
        }
    },

    /**
     * Reset section index when loading a new song
     */
    resetSectionIndex() {
        this.currentSectionIndex = -1;
    },

    /**
     * Navigate to the next song in the playlist
     */
    async nextSong() {
        if (this.playlistLocked) {
            console.log('🔒 Playlist locked - use playlist to change songs');
            return;
        }

        if (!window.sessionManager || !window.sessionManager.activeSession) {
            console.log('📻 Not in a session, cannot navigate songs');
            return;
        }

        try {
            const playlist = await window.sessionManager.getPlaylist();
            if (!playlist || playlist.length === 0) return;

            // Find current song index
            const currentIndex = playlist.findIndex(song => song.id === this.currentSongId);

            // Get next song (wrap around to first if at end)
            const nextIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
            const nextSong = playlist[nextIndex];

            if (nextSong) {
                await this.loadSongFromPlaylist(nextSong.id);
                console.log(`⏭️ MIDI: Next song - ${nextSong.name}`);
            }
        } catch (error) {
            console.error('Error navigating to next song:', error);
        }
    },

    /**
     * Navigate to the previous song in the playlist
     */
    async previousSong() {
        if (this.playlistLocked) {
            console.log('🔒 Playlist locked - use playlist to change songs');
            return;
        }

        if (!window.sessionManager || !window.sessionManager.activeSession) {
            console.log('📻 Not in a session, cannot navigate songs');
            return;
        }

        try {
            const playlist = await window.sessionManager.getPlaylist();
            if (!playlist || playlist.length === 0) return;

            // Find current song index
            const currentIndex = playlist.findIndex(song => song.id === this.currentSongId);

            // Get previous song (wrap around to last if at beginning)
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
            const prevSong = playlist[prevIndex];

            if (prevSong) {
                await this.loadSongFromPlaylist(prevSong.id);
                console.log(`⏮️ MIDI: Previous song - ${prevSong.name}`);
            }
        } catch (error) {
            console.error('Error navigating to previous song:', error);
        }
    },

    /**
     * Initialize MIDI controller when entering Live Mode
     */
    async initMIDI() {
        if (!window.midiController) {
            console.log('🎹 MIDI controller module not loaded');
            return false;
        }

        // Initialize MIDI access
        const success = await midiController.init();

        if (success) {
            // Set up action handlers - CC30/31 navigate sections, CC32/33 navigate songs
            midiController.actions.scrollDown = () => this.navigateSection(1);   // Next section
            midiController.actions.scrollUp = () => this.navigateSection(-1);    // Previous section
            midiController.actions.nextSong = () => this.nextSong();
            midiController.actions.prevSong = () => this.previousSong();

            // Load saved mappings
            await midiController.loadMappings();

            console.log('🎹 MIDI controller initialized for Live Mode');
            return true;
        }

        return false;
    },

    // ============== Auto-Scroll Feature ==============

    /**
     * Set song duration in seconds
     */
    setAutoScrollDuration(seconds) {
        this.autoScrollDuration = Math.max(10, Math.min(1800, seconds)); // 10s to 30min
        this.updateAutoScrollUI();

        // Save to current song if one is loaded
        if (this.currentSongId) {
            this.saveSongDuration(this.currentSongId, this.autoScrollDuration);
        }

        console.log(`⏱️ Auto-scroll duration set to ${this.formatTime(this.autoScrollDuration)}`);
    },

    /**
     * Parse time string (MM:SS or M:SS) to seconds
     */
    parseTimeToSeconds(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return minutes * 60 + seconds;
        }
        return parseInt(timeStr) || 180; // Default 3 minutes
    },

    /**
     * Format seconds to MM:SS string
     */
    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Start auto-scroll
     */
    startAutoScroll() {
        if (this.autoScrollEnabled && !this.autoScrollPaused) {
            // Already running, do nothing
            return;
        }

        const content = document.getElementById('liveModeContent');
        if (!content) return;

        // If resuming from pause
        if (this.autoScrollPaused && this.autoScrollPausedAt !== null) {
            // Calculate how much time was elapsed before pause
            const elapsedBeforePause = this.autoScrollPausedAt - this.autoScrollStartTime;
            // Adjust start time to account for pause
            this.autoScrollStartTime = performance.now() - elapsedBeforePause;
            this.autoScrollPaused = false;
            this.autoScrollPausedAt = null;
        } else {
            // Fresh start - calculate start time from current progress
            const elapsedTime = this.autoScrollProgress * this.autoScrollDuration * 1000;
            this.autoScrollStartTime = performance.now() - elapsedTime;
        }

        this.autoScrollEnabled = true;
        this.autoScrollPaused = false;
        this.autoScrollManualOverride = false;

        // Auto-save to session preferences
        if (this.currentSongId) {
            this.saveSongPreferences(this.currentSongId, { autoScrollEnabled: true });
        }

        // Start animation loop
        this.runAutoScroll();

        // Update UI
        this.updateAutoScrollUI();

        // Show timeline when auto-scroll starts
        this.showTimeline = true;
        const timelineContainer = document.getElementById('verticalTimelineContainer');
        if (timelineContainer) timelineContainer.style.display = 'flex';
        const timelineCheckbox = document.getElementById('liveModeTimeline');
        if (timelineCheckbox) timelineCheckbox.checked = true;

        console.log(`▶️ Auto-scroll started (${this.formatTime(this.autoScrollDuration)})`);
    },

    /**
     * Pause auto-scroll
     */
    pauseAutoScroll() {
        if (!this.autoScrollEnabled || this.autoScrollPaused) return;

        this.autoScrollPaused = true;
        this.autoScrollPausedAt = performance.now();

        // Cancel animation frame
        if (this.autoScrollAnimationId) {
            cancelAnimationFrame(this.autoScrollAnimationId);
            this.autoScrollAnimationId = null;
        }

        this.updateAutoScrollUI();
        console.log(`⏸️ Auto-scroll paused at ${this.formatTime(this.autoScrollProgress * this.autoScrollDuration)}`);
    },

    /**
     * Stop auto-scroll completely
     */
    stopAutoScroll() {
        this.autoScrollEnabled = false;
        this.autoScrollPaused = false;
        this.autoScrollProgress = 0;
        this.autoScrollStartTime = null;
        this.autoScrollPausedAt = null;

        // Auto-save to session preferences
        if (this.currentSongId) {
            this.saveSongPreferences(this.currentSongId, { autoScrollEnabled: false });
        }

        // Cancel animation frame
        if (this.autoScrollAnimationId) {
            cancelAnimationFrame(this.autoScrollAnimationId);
            this.autoScrollAnimationId = null;
        }

        // Reset scroll position
        const content = document.getElementById('liveModeContent');
        if (content) {
            content.scrollTop = 0;
        }

        this.updateAutoScrollUI();

        // Hide timeline when auto-scroll stops
        this.showTimeline = false;
        const timelineContainer = document.getElementById('verticalTimelineContainer');
        if (timelineContainer) timelineContainer.style.display = 'none';
        const timelineCheckbox = document.getElementById('liveModeTimeline');
        if (timelineCheckbox) timelineCheckbox.checked = false;

        console.log('⏹️ Auto-scroll stopped');
    },

    /**
     * Toggle auto-scroll play/pause
     */
    toggleAutoScroll() {
        if (!this.autoScrollEnabled) {
            this.startAutoScroll();
        } else if (this.autoScrollPaused) {
            this.startAutoScroll(); // Resume
        } else {
            this.pauseAutoScroll();
        }
    },

    /**
     * Run the auto-scroll animation loop
     */
    runAutoScroll() {
        if (!this.autoScrollEnabled || this.autoScrollPaused) return;

        const content = document.getElementById('liveModeContent');
        if (!content) return;

        const now = performance.now();
        const elapsed = now - this.autoScrollStartTime;
        const durationMs = this.autoScrollDuration * 1000;

        // Calculate progress (0 to 1)
        this.autoScrollProgress = Math.min(1, elapsed / durationMs);

        // Calculate scroll position
        const maxScroll = content.scrollHeight - content.clientHeight;
        const targetScroll = this.autoScrollProgress * maxScroll;

        // Only scroll if not in manual override mode
        if (!this.autoScrollManualOverride) {
            content.scrollTop = targetScroll;
        }

        // Update progress bar and time display
        this.updateAutoScrollProgress();

        // Continue if not finished
        if (this.autoScrollProgress < 1) {
            this.autoScrollAnimationId = requestAnimationFrame(() => this.runAutoScroll());
        } else {
            // Finished - auto-stop
            this.autoScrollEnabled = false;
            this.autoScrollPaused = false;
            this.updateAutoScrollUI();
            console.log('✅ Auto-scroll completed');
        }
    },

    /**
     * Update progress bar and time display (both horizontal and vertical)
     */
    updateAutoScrollProgress() {
        const progressBar = document.getElementById('autoScrollProgressFill');
        const timeDisplay = document.getElementById('autoScrollTimeDisplay');
        const verticalFill = document.getElementById('verticalTimelineFill');
        const verticalHandle = document.getElementById('verticalTimelineHandle');
        const verticalTimeEnd = document.getElementById('verticalTimeEnd');

        // Horizontal progress bar (hidden but still updated for compatibility)
        if (progressBar) {
            progressBar.style.width = `${this.autoScrollProgress * 100}%`;
        }

        // Vertical timeline
        if (verticalFill) {
            verticalFill.style.height = `${this.autoScrollProgress * 100}%`;
        }
        if (verticalHandle) {
            verticalHandle.style.top = `${this.autoScrollProgress * 100}%`;
        }

        // Time displays
        if (timeDisplay) {
            const elapsed = this.autoScrollProgress * this.autoScrollDuration;
            timeDisplay.textContent = `${this.formatTime(elapsed)} / ${this.formatTime(this.autoScrollDuration)}`;
        }
        if (verticalTimeEnd) {
            verticalTimeEnd.textContent = this.formatTime(this.autoScrollDuration);
        }
    },

    /**
     * Update auto-scroll UI elements (button states, etc.)
     */
    updateAutoScrollUI() {
        const playBtn = document.getElementById('autoScrollPlayBtn');
        const durationInput = document.getElementById('autoScrollDuration');
        const progressBar = document.getElementById('autoScrollProgressFill');

        if (playBtn) {
            if (this.autoScrollEnabled && !this.autoScrollPaused) {
                playBtn.textContent = '⏸';
                playBtn.title = 'Pause auto-scroll';
                playBtn.style.background = 'linear-gradient(135deg, #16a34a, #22c55e)';
            } else {
                playBtn.textContent = '▶';
                playBtn.title = 'Start auto-scroll';
                playBtn.style.background = 'linear-gradient(135deg, #0ea5e9, #06b6d4)';
            }
        }

        if (durationInput) {
            durationInput.value = this.formatTime(this.autoScrollDuration);
        }

        this.updateAutoScrollProgress();
    },

    /**
     * Handle manual scroll during auto-scroll
     * Adjusts the time position based on scroll direction
     */
    handleManualScroll(scrollTop) {
        if (!this.autoScrollEnabled) return;

        const content = document.getElementById('liveModeContent');
        if (!content) return;

        const maxScroll = content.scrollHeight - content.clientHeight;
        if (maxScroll <= 0) return;

        // Calculate new progress from scroll position
        const newProgress = scrollTop / maxScroll;
        this.autoScrollProgress = Math.max(0, Math.min(1, newProgress));

        // Adjust start time to match new progress
        const newElapsed = this.autoScrollProgress * this.autoScrollDuration * 1000;
        this.autoScrollStartTime = performance.now() - newElapsed;

        // Update display
        this.updateAutoScrollProgress();

        // Set manual override flag (cleared after a short delay)
        this.autoScrollManualOverride = true;
        this.lastManualScrollTime = performance.now();

        // Clear manual override after 500ms of no scrolling
        setTimeout(() => {
            if (performance.now() - this.lastManualScrollTime >= 500) {
                this.autoScrollManualOverride = false;
            }
        }, 500);
    },

    /**
     * Handle click on content to pause/resume auto-scroll
     */
    handleAutoScrollClick() {
        if (this.autoScrollEnabled) {
            this.toggleAutoScroll();
        }
    },

    /**
     * Save song duration to Firebase
     */
    async saveSongDuration(songId, duration) {
        const user = window.auth?.currentUser;
        if (!user || !songId) return;

        try {
            await firebase.database()
                .ref(`users/${user.uid}/liveModePreferences/songPreferences/${songId}/duration`)
                .set(duration);
            console.log(`💾 Saved duration ${this.formatTime(duration)} for song ${songId}`);
        } catch (error) {
            console.error('Error saving song duration:', error);
        }
    },

    /**
     * Load song duration from Firebase
     */
    async loadSongDuration(songId) {
        const user = window.auth?.currentUser;
        if (!user || !songId) return null;

        try {
            const snapshot = await firebase.database()
                .ref(`users/${user.uid}/liveModePreferences/songPreferences/${songId}/duration`)
                .once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error loading song duration:', error);
            return null;
        }
    },

    /**
     * Initialize auto-scroll for current song
     * @param {string} songId - Song ID
     * @param {string} songDuration - Optional duration from song data (M:SS format)
     */
    async initAutoScrollForSong(songId, songDuration = null) {
        // Stop any running auto-scroll
        this.stopAutoScroll();

        // Priority: 1. Firebase preferences, 2. Song data field, 3. Content directive, 4. Default
        const savedDuration = await this.loadSongDuration(songId);
        if (savedDuration) {
            this.autoScrollDuration = savedDuration;
        } else if (songDuration) {
            // Parse duration from song data field (M:SS format)
            const parsed = this.parseTimeToSeconds(songDuration);
            if (parsed > 0) {
                this.autoScrollDuration = parsed;
            } else {
                this.autoScrollDuration = 180;
            }
        } else {
            // Try to parse duration from song content {duration: M:SS}
            const contentDuration = this.parseDurationFromContent();
            if (contentDuration) {
                this.autoScrollDuration = contentDuration;
            } else {
                // Use default
                this.autoScrollDuration = 180;
            }
        }

        this.updateAutoScrollUI();
    },

    /**
     * Parse duration from song content {duration: M:SS} directive
     */
    parseDurationFromContent() {
        if (!this.currentSongContent) return null;

        const match = this.currentSongContent.match(/\{duration:\s*(\d+):(\d{2})\}/i);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            return minutes * 60 + seconds;
        }
        return null;
    },

    /**
     * Set up auto-scroll event listeners
     */
    setupAutoScrollListeners() {
        const content = document.getElementById('liveModeContent');
        if (!content) return;

        // Track manual scrolling
        let scrollTimeout = null;
        content.addEventListener('scroll', () => {
            // If auto-scroll is running and user scrolls manually
            if (this.autoScrollEnabled && !this.autoScrollPaused) {
                // Clear previous timeout
                if (scrollTimeout) clearTimeout(scrollTimeout);

                // Detect if this is manual scroll (not auto-scroll)
                const now = performance.now();
                if (now - this.lastManualScrollTime > 100 || this.autoScrollManualOverride) {
                    this.handleManualScroll(content.scrollTop);
                }

                // Set timeout to resume auto control after manual scroll stops
                scrollTimeout = setTimeout(() => {
                    this.autoScrollManualOverride = false;
                }, 500);
            }
        });

        // Click to pause/resume (handled in content click handler)
    },

    /**
     * Handle click on progress bar to seek
     */
    handleProgressBarClick(event) {
        const progressContainer = event.currentTarget;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const newProgress = clickX / rect.width;

        // Set new progress
        this.autoScrollProgress = Math.max(0, Math.min(1, newProgress));

        // Update scroll position
        const content = document.getElementById('liveModeContent');
        if (content) {
            const maxScroll = content.scrollHeight - content.clientHeight;
            content.scrollTop = this.autoScrollProgress * maxScroll;
        }

        // Adjust start time if auto-scroll is running
        if (this.autoScrollEnabled) {
            const newElapsed = this.autoScrollProgress * this.autoScrollDuration * 1000;
            this.autoScrollStartTime = performance.now() - newElapsed;
        }

        // Update display
        this.updateAutoScrollProgress();

        console.log(`⏩ Seeked to ${this.formatTime(this.autoScrollProgress * this.autoScrollDuration)}`);
    },

    /**
     * Handle click on vertical timeline to seek
     */
    handleVerticalTimelineClick(event) {
        const container = event.currentTarget;
        const rect = container.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const newProgress = clickY / rect.height;

        // Set new progress
        this.autoScrollProgress = Math.max(0, Math.min(1, newProgress));

        // Update scroll position
        const content = document.getElementById('liveModeContent');
        if (content) {
            const maxScroll = content.scrollHeight - content.clientHeight;
            content.scrollTop = this.autoScrollProgress * maxScroll;
        }

        // Adjust start time if auto-scroll is running
        if (this.autoScrollEnabled) {
            const newElapsed = this.autoScrollProgress * this.autoScrollDuration * 1000;
            this.autoScrollStartTime = performance.now() - newElapsed;
        }

        // Update display
        this.updateAutoScrollProgress();

        console.log(`⏩ Seeked to ${this.formatTime(this.autoScrollProgress * this.autoScrollDuration)}`);
    }
};

// Set up event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Helper function for Go Live click
    function handleGoLiveClick() {
        // If not in a session, show My Sessions modal first
        if (!window.sessionManager || !window.sessionManager.activeSession) {
            const mySessionsModal = document.getElementById('mySessionsModal');
            if (mySessionsModal) {
                mySessionsModal.style.display = 'flex';
                // Load sessions if function exists
                if (window.loadMySessions) {
                    window.loadMySessions();
                }
            }
        } else {
            // Already in a session, enter Live Mode
            liveMode.enter();
        }
    }

    // Go Live buttons - all should have the same behavior
    const goLiveButtons = [
        document.getElementById('goLiveButton'),
        document.getElementById('headerGoLiveBtn'),
        document.getElementById('sideMenuGoLive')
    ];

    goLiveButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', handleGoLiveClick);
        }
    });

    // Tap to show controls and toggle sidebar (if in session)
    const liveModeContent = document.getElementById('liveModeContent');
    if (liveModeContent) {
        liveModeContent.addEventListener('click', (e) => {
            // Don't toggle if clicking on a button
            if (e.target.tagName !== 'BUTTON') {
                // If auto-scroll is running, pause/resume it
                if (liveMode.autoScrollEnabled) {
                    liveMode.toggleAutoScroll();
                    // Show controls briefly to show pause/resume state
                    liveMode.showControls();
                    liveMode.startAutoHideTimer();
                    return; // Don't toggle playlist when controlling auto-scroll
                }

                // Always show controls on tap
                liveMode.showControls();
                liveMode.startAutoHideTimer();

                // If in session and controls were already visible, toggle playlist
                if (window.sessionManager && window.sessionManager.activeSession) {
                    liveMode.togglePlaylist();
                }
            }
        });

        // Pinch-to-zoom for font size on mobile
        let initialPinchDistance = 0;
        let initialFontSize = 14;
        let isPinching = false;

        liveModeContent.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                isPinching = true;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialPinchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                // Get current font size
                const chartDisplay = document.getElementById('liveModeChartDisplay');
                if (chartDisplay) {
                    const currentSize = parseFloat(window.getComputedStyle(chartDisplay).fontSize);
                    initialFontSize = currentSize; // in pixels
                }
                e.preventDefault();
            }
        }, { passive: false });

        liveModeContent.addEventListener('touchmove', (e) => {
            if (isPinching && e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );

                // Calculate scale factor
                const scale = currentDistance / initialPinchDistance;
                const newFontSize = Math.max(10, Math.min(60, initialFontSize * scale));

                // Apply new font size
                const chartDisplay = document.getElementById('liveModeChartDisplay');
                if (chartDisplay) {
                    chartDisplay.style.fontSize = newFontSize + 'px';

                    // Show live font size value (convert px to pt for display)
                    const ptSize = Math.round(newFontSize * 0.75);
                    const zoomValue = document.getElementById('liveModeZoomValue');
                    if (zoomValue) zoomValue.textContent = ptSize + 'pt';
                }

                e.preventDefault();
            }
        }, { passive: false });

        liveModeContent.addEventListener('touchend', (e) => {
            if (isPinching && e.touches.length < 2) {
                isPinching = false;

                // Get final font size and convert to pt, then save
                const chartDisplay = document.getElementById('liveModeChartDisplay');
                if (chartDisplay) {
                    const finalPxSize = parseFloat(window.getComputedStyle(chartDisplay).fontSize);
                    // Convert px to pt (1pt = 1.333px, so pt = px * 0.75)
                    const finalPtSize = Math.round(finalPxSize * 0.75);
                    // Clamp to valid range
                    const clampedSize = Math.max(8, Math.min(24, finalPtSize));

                    // Use setFontSize to save per-song (if song loaded) or global
                    liveMode.setFontSize(clampedSize);

                    console.log(`📺 Pinch zoom: ${finalPtSize}pt (clamped to ${clampedSize}pt)`);
                }
            }
        });
    }

    // Note: Session manager callback is set up in app.js (handleSongUpdateFromLeader)
    // which now also updates Live Mode when active

    // Escape key to exit
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && liveMode.isActive) {
            liveMode.exit();
        }
    });
});

// Expose globally
window.liveMode = liveMode;

console.log('✅ Live Mode initialized');
