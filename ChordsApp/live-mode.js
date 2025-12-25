// ChordsApp Live Mode - Full-screen performance view
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
    fullOverviewMode: false,
    savedDisplaySettings: null,

    /**
     * Enter live mode with current song
     */
    enter() {
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

        console.log('📺 Exited Live Mode');
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

                // If in session as player, save local transpose preference
                if (window.sessionManager && window.sessionManager.activeSession && !window.sessionManager.isLeader) {
                    const songId = this.currentSongId || 'current';
                    window.sessionManager.setLocalTranspose(songId, this.currentTransposeSteps);
                }

                console.log(`🎵 Transposed ${steps > 0 ? '+' : ''}${steps} to ${newKey}`);
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

        console.log(`📺 Badges ${show ? 'shown' : 'hidden'}`);
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

            // Show badges in full overview mode
            chartDisplay.classList.remove('hide-badges');
            const badgesCheckbox = document.getElementById('liveModeBadges');
            if (badgesCheckbox) badgesCheckbox.checked = true;
            this.showBadges = true;

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

            // Update button style
            if (btn) {
                btn.style.background = 'var(--button-bg)';
                btn.style.borderColor = 'var(--border)';
                btn.textContent = '📄 Full Overview';
            }

            console.log('📺 Full Overview mode OFF');
        }
    },

    /**
     * Set font size for Full Overview mode
     * Uses a readable default - user can pinch-to-zoom to adjust
     */
    autoFitFontSize() {
        const chartDisplay = document.getElementById('liveModeChartDisplay');

        if (!chartDisplay) return;

        // Set a readable default font size for overview mode
        // User can use pinch-to-zoom to adjust
        const fontSize = 14;
        chartDisplay.style.fontSize = fontSize + 'pt';
        chartDisplay.style.lineHeight = '1.5';

        // Ensure single column stays applied (forcefully)
        chartDisplay.style.columnCount = '1';
        chartDisplay.style.columns = 'auto';
        chartDisplay.style.columnWidth = 'auto';
        chartDisplay.style.height = 'auto';

        console.log(`📺 Full Overview font size: ${fontSize}pt`);
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
     * Show playlist sidebar
     */
    async showPlaylist() {
        const playlistSidebar = document.getElementById('liveModePlaylistSidebar');
        const playlistContent = document.getElementById('liveModePlaylistContent');
        const toggleBtn = document.getElementById('liveModePlaylistToggle');

        if (!playlistSidebar || !playlistContent) return;

        // Slide sidebar in
        playlistSidebar.style.right = '0';
        this.sidebarVisible = true;

        // Update button text
        if (toggleBtn) {
            toggleBtn.textContent = 'Hide Playlist';
        }

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
     * Hide playlist sidebar
     */
    hidePlaylist() {
        const playlistSidebar = document.getElementById('liveModePlaylistSidebar');
        const toggleBtn = document.getElementById('liveModePlaylistToggle');

        if (playlistSidebar) {
            playlistSidebar.style.right = '-300px';
            this.sidebarVisible = false;
        }

        // Update button text
        if (toggleBtn) {
            toggleBtn.textContent = 'Show Playlist';
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

            // Build display name from structured fields
            const title = songData.title || songData.name || 'Untitled';
            const author = songData.author ? ` - ${songData.author}` : '';
            const bpmInfo = songData.bpm ? ` | ${songData.bpm} BPM` : '';
            const timeInfo = songData.timeSignature ? ` | ${songData.timeSignature}` : '';
            this.currentSongName = `${title}${author}${bpmInfo}${timeInfo}`;

            // Check for local transpose preference
            if (!window.sessionManager.isLeader) {
                const localTranspose = window.sessionManager.getLocalTranspose(songId);
                if (localTranspose !== 0) {
                    // Apply local transpose
                    for (let i = 0; i < Math.abs(localTranspose); i++) {
                        this.transpose(localTranspose > 0 ? 1 : -1);
                    }
                }
            }

            // Update display
            this.updateDisplay();

            // Hide playlist
            this.hidePlaylist();

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
    updateFromBroadcast(songData) {
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

        // Update display
        this.updateDisplay();

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
        });

        // Add highlight to selected section
        if (sectionId) {
            const selectedBlock = document.querySelector(`[data-section-id="${sectionId}"]`);
            if (selectedBlock) {
                // Start with blinking animation
                selectedBlock.classList.add('section-selected');

                // Scroll to section if needed
                selectedBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // After 2 seconds, switch to static border (no background animation)
                setTimeout(() => {
                    selectedBlock.classList.remove('section-selected');
                    selectedBlock.classList.add('section-selected-static');
                }, 2000);
            }
        }
    },

    /**
     * Apply saved user preferences from Firebase to Live Mode display
     */
    async applySavedPreferences(chartDisplay) {
        // Skip if in Full Overview mode - it has its own layout
        if (this.fullOverviewMode) return;

        const user = window.auth ? window.auth.currentUser : null;
        if (!user) return;

        try {
            const snapshot = await firebase.database().ref(`users/${user.uid}/printPreviewPreferences`).once('value');
            const preferences = snapshot.val();

            // Check again after await - Full Overview may have been enabled while waiting
            if (this.fullOverviewMode) return;

            if (preferences && chartDisplay) {
                // Apply font size
                if (preferences.fontSize) {
                    chartDisplay.style.fontSize = `${preferences.fontSize}pt`;
                }

                // Apply line height
                if (preferences.lineHeight) {
                    chartDisplay.style.lineHeight = preferences.lineHeight;
                }

                // Apply column layout with page count
                const columns = preferences.columnCount || preferences.columnLayout || 2; // Support both old and new field
                const pages = preferences.pageCount || 1;
                const A4_HEIGHT_PX = 1123;
                const height = A4_HEIGHT_PX * pages;

                chartDisplay.style.columns = columns.toString();
                chartDisplay.style.columnFill = 'auto';
                chartDisplay.style.height = height + 'px';

                if (columns > 1) {
                    chartDisplay.style.columnGap = '40px';
                    chartDisplay.style.columnRule = '1px solid rgba(0, 0, 0, 0.2)';
                } else {
                    chartDisplay.style.columnGap = '0px';
                    chartDisplay.style.columnRule = 'none';
                }

                console.log('✅ Applied saved preferences to Live Mode:', preferences, `(${columns} columns × ${pages} pages)`);
            }
        } catch (error) {
            console.error('❌ Error applying saved preferences to Live Mode:', error);
        }
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
                }

                e.preventDefault();
            }
        }, { passive: false });

        liveModeContent.addEventListener('touchend', (e) => {
            if (isPinching && e.touches.length < 2) {
                isPinching = false;
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
