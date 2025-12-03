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
            alert('No song loaded. Please analyze or load a song first.');
            return;
        }

        // Get current song data from editor (if available)
        if (hasEditorContent) {
            this.currentSongContent = visualEditor.value;
            this.currentKey = keySelector ? keySelector.value : 'C Major';
            this.currentTransposeSteps = window.currentTransposeSteps || 0;
            this.currentSongName = window.currentSongName || 'Untitled';
            this.currentSongId = window.currentSongId || null;
        } else {
            // No editor content but in session - show empty state, user will tap to see playlist
            this.currentSongContent = '\n\n\n        Tap to view playlist\n        and select a song';
            this.currentKey = '';
            this.currentTransposeSteps = 0;
            this.currentSongName = 'Select a Song';
            this.currentSongId = null;
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
                const formattedHTML = window.formatForPreview(this.currentSongContent, {
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
            // Extract just the note from the key (e.g., "C Major" -> "C")
            const keyNote = this.currentKey.split(' ')[0];
            currentKeyEl.textContent = keyNote;
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

        if (topBar) topBar.style.opacity = '1';
        if (bottomBar) bottomBar.style.opacity = '1';

        this.controlsVisible = true;
    },

    /**
     * Hide controls
     */
    hideControls() {
        const topBar = document.getElementById('liveModeTopBar');
        const bottomBar = document.getElementById('liveModeBottomBar');

        if (topBar) topBar.style.opacity = '0';
        if (bottomBar) bottomBar.style.opacity = '0';

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
        }, 4000);
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
                             style="padding: 12px 16px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s ease;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="color: ${numberColor}; font-weight: 600; min-width: 24px;">${index + 1}</span>
                                <div style="flex: 1;">
                                    <div style="color: var(--text); font-weight: ${fontWeight};">${song.name}</div>
                                    <div style="color: var(--text-muted); font-size: 12px;">${song.originalKey || 'Unknown key'}${song.bpm ? ` • ${song.bpm} BPM` : ''}</div>
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
            playlistSidebar.style.right = '-380px';
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
                keySelector.value = songData.key || songData.originalKey;
            }

            // ✅ UPDATE LIVE MODE STATE WITH NEW STRUCTURED FIELDS
            this.currentSongContent = songData.content || '';
            this.currentKey = songData.key || songData.originalKey || 'C Major';
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
        this.currentKey = songData.key || songData.originalKey || 'C Major';
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
        const user = window.auth ? window.auth.currentUser : null;
        if (!user) return;

        try {
            const snapshot = await firebase.database().ref(`users/${user.uid}/printPreviewPreferences`).once('value');
            const preferences = snapshot.val();

            if (preferences && chartDisplay) {
                // Apply font size
                if (preferences.fontSize) {
                    chartDisplay.style.fontSize = `${preferences.fontSize}pt`;
                }

                // Apply line height
                if (preferences.lineHeight) {
                    chartDisplay.style.lineHeight = preferences.lineHeight;
                }

                // Apply column layout
                if (preferences.columnLayout) {
                    chartDisplay.style.columns = preferences.columnLayout;
                    chartDisplay.style.columnGap = '40px';
                }

                console.log('✅ Applied saved preferences to Live Mode:', preferences);
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
