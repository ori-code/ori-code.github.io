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
    autoHidePlaylist: true,
    showPlaylistWithControls: false,
    fullOverviewMode: false,
    savedDisplaySettings: null,
    currentColumnLayout: 2,
    currentFontSize: 14,
    isSingerMode: false, // Singer mode: lyrics only, limited controls
    isPublicViewMode: false, // Public view mode: viewing shared public song

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
     * Save per-song preferences to Firebase (fontSize, transpose, columns)
     */
    async saveSongPreferences(songId, prefs = {}) {
        const user = window.auth?.currentUser;
        if (!user || !songId) return;

        try {
            // Load existing preferences first to merge
            const existing = await this.loadSongPreferences(songId) || {};
            const merged = { ...existing, ...prefs, savedAt: Date.now() };

            await firebase.database()
                .ref(`users/${user.uid}/liveModePreferences/songPreferences/${songId}`)
                .set(merged);
            console.log(`✅ Saved preferences for song ${songId}:`, merged);
        } catch (error) {
            console.error('❌ Error saving song preferences:', error);
        }
    },

    /**
     * Load per-song preferences from Firebase
     */
    async loadSongPreferences(songId) {
        const user = window.auth?.currentUser;
        if (!user || !songId) return null;

        try {
            const snapshot = await firebase.database()
                .ref(`users/${user.uid}/liveModePreferences/songPreferences/${songId}`)
                .once('value');
            return snapshot.val();
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
     * Enter Singer Mode - simplified lyrics-only view for anonymous users
     * Hides all chord-related controls, locks to lyrics display mode
     */
    async enterSingerMode() {
        this.isSingerMode = true;
        this.displayMode = 'lyrics'; // Lock to lyrics only

        // Force the dropdown to lyrics mode so updateDisplay uses it
        const displayDropdown = document.getElementById('liveModeDisplayMode');
        if (displayDropdown) displayDropdown.value = 'lyrics';

        // Also sync the main editor dropdown for makeChordsBold
        const nashvilleDropdown = document.getElementById('nashvilleMode');
        if (nashvilleDropdown) nashvilleDropdown.value = 'lyrics';

        // Show overlay first
        const overlay = document.getElementById('liveModeOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            this.isActive = true;
            this.sidebarVisible = false;

            // Lock body scroll
            document.body.style.overflow = 'hidden';
        }

        // Hide controls that singers shouldn't see (only transpose and display mode)
        const controlsToHide = [
            'liveModeDisplayMode',       // No display mode dropdown (locked to lyrics)
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

        // Force lyrics mode for singers
        if (this.isSingerMode) {
            this.displayMode = 'lyrics';
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
                        const badges = badgesList
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
                            }).join('');

                        const badgesRow = document.createElement('div');
                        badgesRow.className = 'section-badges-row';
                        badgesRow.innerHTML = badges;
                        chartDisplay.insertBefore(badgesRow, chartDisplay.firstChild);
                        console.log('🏷️ Live Mode: Added arrangement badges');
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
        }, 2000);
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
                if (this.currentSongId) {
                    this.saveSongTranspose(this.currentSongId, this.currentTransposeSteps);
                }

                // Also keep session manager sync for live session features
                if (window.sessionManager && window.sessionManager.activeSession && !window.sessionManager.isLeader) {
                    const songId = this.currentSongId || 'current';
                    window.sessionManager.setLocalTranspose(songId, this.currentTransposeSteps);
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
                content.style.padding = '60px 20px 140px 20px';
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
            content.style.padding = '60px 24px 140px 24px';

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
                content.style.padding = this.savedDisplaySettings.padding || '60px 20px 140px 20px';
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
     * Show playlist sidebar
     */
    async showPlaylist() {
        const playlistSidebar = document.getElementById('liveModePlaylistSidebar');
        const playlistContent = document.getElementById('liveModePlaylistContent');

        if (!playlistSidebar || !playlistContent) return;

        // Slide sidebar in
        playlistSidebar.style.right = '0';
        this.sidebarVisible = true;

        playlistContent.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Loading playlist...</p>';

        try {
            // Get playlist from session manager
            if (window.sessionManager && window.sessionManager.activeSession) {
                const playlist = await window.sessionManager.getPlaylist();

                if (playlist.length === 0) {
                    playlistContent.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No songs in playlist</p>';
                    return;
                }

                // Get current song ID (what player is viewing)
                const currentSongId = this.currentSongId;

                // Get leader's current song ID (what leader is broadcasting)
                const leaderSong = window.sessionManager.leaderCurrentSong;
                const leaderSongId = leaderSong ? leaderSong.songId : null;
                const isLeader = window.sessionManager.isLeader;

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

                    return `
                        <div onclick="liveMode.loadSongFromPlaylist('${song.id}')"
                             style="padding: 8px 12px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s ease;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="color: ${numberColor}; font-weight: 600; min-width: 20px; font-size: 13px;">${index + 1}</span>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="color: var(--text); font-weight: ${fontWeight}; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.name}</div>
                                    <div style="color: var(--text-muted); font-size: 11px;">${song.originalKey || 'Unknown key'}${song.bpm ? ` • ${song.bpm} BPM` : ''}</div>
                                </div>
                                ${indicator}
                            </div>
                        </div>
                    `;
                }).join('');
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

            // Load ALL per-song preferences (fontSize, columns, transpose)
            const savedPrefs = await this.loadSongPreferences(songId);
            if (savedPrefs) {
                console.log(`📺 Loaded per-song preferences for ${songId}:`, savedPrefs);

                // Apply font size
                if (savedPrefs.fontSize) {
                    this.currentFontSize = savedPrefs.fontSize;
                }

                // Apply columns
                if (savedPrefs.columns) {
                    this.currentColumnLayout = savedPrefs.columns;
                }

                // Apply transpose (use saved preference, overrides session manager)
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
            } else {
                // Fallback to session manager local transpose for players (backwards compatibility)
                if (!window.sessionManager.isLeader) {
                    const localTranspose = window.sessionManager.getLocalTranspose(songId);
                    if (localTranspose !== 0) {
                        for (let i = 0; i < Math.abs(localTranspose); i++) {
                            this.transpose(localTranspose > 0 ? 1 : -1);
                        }
                    }
                }
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

        // Check for local transpose preference
        if (window.sessionManager && !window.sessionManager.isLeader) {
            const localTranspose = window.sessionManager.getLocalTranspose(songData.songId);
            if (localTranspose !== 0) {
                // We need to apply transpose to the content
                if (typeof window.transposeChart === 'function') {
                    this.currentSongContent = window.transposeChart(this.currentSongContent, localTranspose);
                    this.currentKey = this.calculateNewKey(this.currentKey, localTranspose);
                    this.currentTransposeSteps = localTranspose;
                }
            }
        }

        // Load player's own per-song preferences (fontSize, columns, transpose)
        const savedPrefs = await this.loadSongPreferences(songData.songId);
        if (savedPrefs) {
            console.log(`📺 Loaded per-song preferences for ${songData.songId}:`, savedPrefs);

            // Apply font size
            if (savedPrefs.fontSize) {
                this.currentFontSize = savedPrefs.fontSize;
            }

            // Apply column layout
            if (savedPrefs.columns) {
                this.currentColumnLayout = savedPrefs.columns;
            }

            // Apply transpose (on top of any local transpose already applied)
            if (savedPrefs.transposeSteps && savedPrefs.transposeSteps !== 0 && this.currentTransposeSteps === 0) {
                // Only apply if we haven't already applied transpose from sessionManager
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
    }
};

// Set up event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Go Live button
    const goLiveBtn = document.getElementById('goLiveButton');
    if (goLiveBtn) {
        goLiveBtn.addEventListener('click', () => {
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
        });
    }

    // Tap to show controls and toggle sidebar (if in session)
    const liveModeContent = document.getElementById('liveModeContent');
    if (liveModeContent) {
        liveModeContent.addEventListener('click', (e) => {
            // Don't toggle if clicking on a button
            if (e.target.tagName !== 'BUTTON') {
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
