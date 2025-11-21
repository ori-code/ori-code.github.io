// ChordsApp Live Mode - Full-screen performance view
// Allows both leaders and players to view songs in distraction-free mode

const liveMode = {
    isActive: false,
    controlsVisible: true,
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

        if (!visualEditor || !visualEditor.value.trim()) {
            alert('No song loaded. Please analyze or load a song first.');
            return;
        }

        // Get current song data
        this.currentSongContent = visualEditor.value;
        this.currentKey = keySelector ? keySelector.value : 'C Major';
        this.currentTransposeSteps = window.currentTransposeSteps || 0;
        this.currentSongName = window.currentSongName || 'Untitled';
        this.currentSongId = window.currentSongId || null;

        // Update display
        this.updateDisplay();

        // Show overlay
        const overlay = document.getElementById('liveModeOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            this.isActive = true;

            // Show controls initially, then auto-hide after 3 seconds
            this.showControls();
            this.startAutoHideTimer();

            // Lock body scroll
            document.body.style.overflow = 'hidden';
        }

        // Update session controls visibility
        this.updateSessionControls();

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
     * Update the song display
     */
    updateDisplay() {
        const chartDisplay = document.getElementById('liveModeChartDisplay');
        const songNameEl = document.getElementById('liveModeSongName');
        const songKeyEl = document.getElementById('liveModeSongKey');
        const currentKeyEl = document.getElementById('liveModeCurrentKey');

        if (chartDisplay) {
            chartDisplay.textContent = this.currentSongContent;
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

        // Keep controls visible while interacting
        this.showControls();
        this.startAutoHideTimer();
    },

    /**
     * Calculate new key after transpose
     * @param {string} currentKey - Current key (e.g., "C Major")
     * @param {number} steps - Transpose steps
     * @returns {string} New key
     */
    calculateNewKey(currentKey, steps) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const parts = currentKey.split(' ');
        const note = parts[0];
        const mode = parts.slice(1).join(' ') || 'Major';

        let noteIndex = notes.indexOf(note);
        if (noteIndex === -1) {
            // Try to find with flat notation
            const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
            noteIndex = notes.indexOf(flatToSharp[note] || note);
        }

        if (noteIndex === -1) return currentKey;

        const newIndex = ((noteIndex + steps) % 12 + 12) % 12;
        return `${notes[newIndex]} ${mode}`;
    },

    /**
     * Update session controls visibility
     */
    updateSessionControls() {
        const sessionControls = document.getElementById('liveModeSessionControls');
        const sessionInfo = document.getElementById('liveModeSessionInfo');

        if (window.sessionManager && window.sessionManager.activeSession) {
            if (sessionControls) sessionControls.style.display = 'block';

            if (sessionInfo) {
                const role = window.sessionManager.isLeader ? 'Leader' : 'Player';
                sessionInfo.textContent = `You are: ${role}`;
            }
        } else {
            if (sessionControls) sessionControls.style.display = 'none';
        }
    },

    /**
     * Toggle playlist overlay
     */
    togglePlaylist() {
        const playlistOverlay = document.getElementById('liveModePlaylistOverlay');
        if (playlistOverlay) {
            if (playlistOverlay.style.display === 'none') {
                this.showPlaylist();
            } else {
                this.hidePlaylist();
            }
        }
    },

    /**
     * Show playlist overlay
     */
    async showPlaylist() {
        const playlistOverlay = document.getElementById('liveModePlaylistOverlay');
        const playlistContent = document.getElementById('liveModePlaylistContent');

        if (!playlistOverlay || !playlistContent) return;

        playlistOverlay.style.display = 'block';
        playlistContent.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center;">Loading playlist...</p>';

        try {
            // Get playlist from session manager
            if (window.sessionManager && window.sessionManager.activeSession) {
                const playlist = await window.sessionManager.getPlaylist();

                if (playlist.length === 0) {
                    playlistContent.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center;">No songs in playlist</p>';
                    return;
                }

                // Get current song ID to highlight
                const currentSongId = this.currentSongId;

                playlistContent.innerHTML = playlist.map((song, index) => {
                    const isCurrent = song.id === currentSongId;
                    const bgColor = isCurrent ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)';
                    const borderColor = isCurrent ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.1)';

                    return `
                        <div onclick="liveMode.loadSongFromPlaylist('${song.id}')"
                             style="padding: 12px 16px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s ease;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="color: ${isCurrent ? '#8b5cf6' : 'rgba(255,255,255,0.5)'}; font-weight: 600; min-width: 24px;">${index + 1}</span>
                                <div style="flex: 1;">
                                    <div style="color: white; font-weight: ${isCurrent ? '600' : '400'};">${song.name}</div>
                                    <div style="color: rgba(255,255,255,0.5); font-size: 12px;">${song.originalKey || 'Unknown key'}${song.bpm ? ` • ${song.bpm} BPM` : ''}</div>
                                </div>
                                ${isCurrent ? '<span style="color: #8b5cf6; font-size: 14px;">▶</span>' : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                playlistContent.innerHTML = '<p style="color: rgba(255,255,255,0.6); text-align: center;">Not in a session</p>';
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            playlistContent.innerHTML = '<p style="color: #ef4444; text-align: center;">Error loading playlist</p>';
        }
    },

    /**
     * Hide playlist overlay
     */
    hidePlaylist() {
        const playlistOverlay = document.getElementById('liveModePlaylistOverlay');
        if (playlistOverlay) {
            playlistOverlay.style.display = 'none';
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

            if (visualEditor) {
                visualEditor.value = songData.content || '';
            }

            if (keySelector && songData.originalKey) {
                keySelector.value = songData.originalKey;
            }

            // Update live mode state
            this.currentSongContent = songData.content || '';
            this.currentKey = songData.originalKey || 'C Major';
            this.currentSongName = songData.name;
            this.currentSongId = songId;
            this.currentTransposeSteps = 0;

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
        if (!this.isActive) return;

        // Update state
        this.currentSongContent = songData.content || '';
        this.currentKey = songData.originalKey || 'C Major';
        this.currentSongName = songData.name;
        this.currentSongId = songData.songId;
        this.currentTransposeSteps = 0;

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

        console.log(`📺 Live Mode updated: ${songData.name}`);
    }
};

// Set up event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Go Live button
    const goLiveBtn = document.getElementById('goLiveButton');
    if (goLiveBtn) {
        goLiveBtn.addEventListener('click', () => liveMode.enter());
    }

    // Tap to toggle controls
    const liveModeContent = document.getElementById('liveModeContent');
    if (liveModeContent) {
        liveModeContent.addEventListener('click', (e) => {
            // Don't toggle if clicking on a button
            if (e.target.tagName !== 'BUTTON') {
                liveMode.toggleControls();
            }
        });
    }

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
