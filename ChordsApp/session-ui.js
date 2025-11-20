// ChordsApp Session UI Manager
// Handles rendering and interaction for live sessions

class SessionUI {
    constructor() {
        this.currentSessionCode = null;
    }

    /**
     * Show create session modal (PRO only)
     */
    showCreateSessionModal() {
        const modal = document.getElementById('createSessionModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('sessionTitleInput').focus();
        }
    }

    /**
     * Hide create session modal
     */
    hideCreateSessionModal() {
        const modal = document.getElementById('createSessionModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('sessionTitleInput').value = '';
        }
    }

    /**
     * Show join session modal
     */
    showJoinSessionModal() {
        const modal = document.getElementById('joinSessionModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('sessionCodeInput').focus();
        }
    }

    /**
     * Hide join session modal
     */
    hideJoinSessionModal() {
        const modal = document.getElementById('joinSessionModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('sessionCodeInput').value = '';
        }
    }

    /**
     * Show my sessions modal
     */
    async showMySessionsModal() {
        const modal = document.getElementById('mySessionsModal');
        if (modal) {
            modal.style.display = 'flex';
            await this.loadUserSessions();
        }
    }

    /**
     * Hide my sessions modal
     */
    hideMySessionsModal() {
        const modal = document.getElementById('mySessionsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Load and display user's saved sessions
     */
    async loadUserSessions() {
        const sessionsList = document.getElementById('sessionsList');
        if (!sessionsList) return;

        sessionsList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Loading sessions...</p>';

        try {
            const sessions = await window.sessionManager.getUserSessions();

            if (sessions.length === 0) {
                sessionsList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No sessions yet. Create your first session!</p>';
                return;
            }

            sessionsList.innerHTML = sessions.map(session => {
                const date = new Date(session.createdAt).toLocaleDateString();
                const role = session.isOwner ? '👑 Leader' : '🎵 Player';

                return `
                    <div class="session-item" style="padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 4px 0; color: var(--text); font-size: 16px;">${session.title}</h4>
                                <p style="margin: 0; font-size: 13px; color: var(--text-muted);">${role} • Created ${date}</p>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--primary); font-family: monospace;">Code: ${session.sessionCode}</p>
                            </div>
                            <div style="display: flex; gap: 8px; flex-direction: column;">
                                ${session.isOwner ? `
                                    <button onclick="sessionUI.addCurrentSongToSession('${session.id}')"
                                            style="padding: 6px 12px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; white-space: nowrap;">
                                        ➕ Add Current Song
                                    </button>
                                    <button onclick="sessionUI.reactivateSession('${session.id}')"
                                            style="padding: 6px 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                                        🔄 Reactivate
                                    </button>
                                ` : `
                                    <button onclick="sessionUI.joinSessionById('${session.id}')"
                                            style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                        Rejoin
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading sessions:', error);
            sessionsList.innerHTML = '<p style="text-align: center; color: var(--primary);">Error loading sessions</p>';
        }
    }

    /**
     * Create session handler
     */
    async handleCreateSession() {
        const titleInput = document.getElementById('sessionTitleInput');
        const title = titleInput.value.trim();

        if (!title) {
            alert('Please enter a session title');
            return;
        }

        try {
            const { sessionId, sessionCode } = await window.sessionManager.createSession(title);
            this.currentSessionCode = sessionCode;

            this.hideCreateSessionModal();
            this.showSessionActive(sessionCode, true);

            alert(`✅ Session created!\n\nShare this code with your band:\n\n${sessionCode}`);

        } catch (error) {
            console.error('Error creating session:', error);
            alert('❌ ' + error.message);
        }
    }

    /**
     * Join session handler
     */
    async handleJoinSession() {
        const codeInput = document.getElementById('sessionCodeInput');
        const sessionCode = codeInput.value.trim().toUpperCase();

        if (!sessionCode) {
            alert('Please enter a session code');
            return;
        }

        try {
            const { sessionId, session } = await window.sessionManager.joinSession(sessionCode);
            this.currentSessionCode = sessionCode;

            this.hideJoinSessionModal();
            this.showSessionActive(sessionCode, false);

            alert(`✅ Joined session: ${session.metadata.title}`);

        } catch (error) {
            console.error('Error joining session:', error);
            alert('❌ ' + error.message);
        }
    }

    /**
     * Reactivate session
     */
    async reactivateSession(sessionId) {
        try {
            const { session } = await window.sessionManager.reactivateSession(sessionId);
            this.currentSessionCode = session.metadata.sessionCode;

            this.hideMySessionsModal();
            this.showSessionActive(session.metadata.sessionCode, true);

            alert(`✅ Session reactivated: ${session.metadata.title}`);

        } catch (error) {
            console.error('Error reactivating session:', error);
            alert('❌ ' + error.message);
        }
    }

    /**
     * Join session by ID (for saved sessions)
     */
    async joinSessionById(sessionId) {
        try {
            // Get session code first
            const snapshot = await firebase.database().ref(`sessions/${sessionId}/metadata/sessionCode`).once('value');
            const sessionCode = snapshot.val();

            if (!sessionCode) {
                throw new Error('Session not found');
            }

            // Join using the code
            const { session } = await window.sessionManager.joinSession(sessionCode);
            this.currentSessionCode = sessionCode;

            this.hideMySessionsModal();
            this.showSessionActive(sessionCode, false);

            alert(`✅ Rejoined session: ${session.metadata.title}`);

        } catch (error) {
            console.error('Error joining session:', error);
            alert('❌ ' + error.message);
        }
    }

    /**
     * Add current song to a session's playlist
     */
    async addCurrentSongToSession(sessionId) {
        try {
            // Get current song data from the editor
            const visualEditor = document.getElementById('visualEditor');
            const keySelector = document.getElementById('keySelector');
            const bpmInput = document.getElementById('bpmInput');

            // Check if there's a song loaded
            if (!visualEditor || !visualEditor.value.trim()) {
                alert('⚠️ No song loaded. Please analyze or load a song first.');
                return;
            }

            // Get song name from global variable or prompt user
            let songName = window.currentSongName || '';
            if (!songName) {
                songName = prompt('Enter song name:');
                if (!songName) return;
            }

            // Prepare song data
            const songData = {
                id: `song_${Date.now()}`,
                name: songName,
                content: visualEditor.value,
                originalKey: keySelector ? keySelector.value : 'Unknown',
                bpm: bpmInput ? parseInt(bpmInput.value) || null : null
            };

            // Add to session playlist
            const playlistRef = firebase.database().ref(`sessions/${sessionId}/playlist/${songData.id}`);

            // Get current playlist to determine order
            const playlistSnapshot = await firebase.database().ref(`sessions/${sessionId}/playlist`).once('value');
            const playlist = playlistSnapshot.val() || {};
            const order = Object.keys(playlist).length;

            await playlistRef.set({
                name: songData.name,
                originalKey: songData.originalKey,
                bpm: songData.bpm,
                addedAt: Date.now(),
                order: order
            });

            this.showToast(`✅ "${songName}" added to session playlist`);

        } catch (error) {
            console.error('Error adding song to session:', error);
            alert('❌ ' + error.message);
        }
    }

    /**
     * Show session active indicator
     */
    showSessionActive(sessionCode, isLeader) {
        const indicator = document.getElementById('sessionStatusIndicator');
        if (!indicator) return;

        indicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">
                <span style="font-size: 20px;">${isLeader ? '📡' : '📻'}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #10b981; font-size: 14px;">
                        ${isLeader ? 'Broadcasting' : 'Connected'} • ${sessionCode}
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted);">
                        ${isLeader ? 'You are the session leader' : 'Following session leader'}
                    </div>
                </div>
                <button onclick="sessionUI.showSessionControls()"
                        style="padding: 6px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: var(--text); cursor: pointer; font-size: 12px;">
                    Options
                </button>
            </div>
        `;

        indicator.style.display = 'block';
    }

    /**
     * Hide session active indicator
     */
    hideSessionActive() {
        const indicator = document.getElementById('sessionStatusIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    /**
     * Show session controls (participants, playlist, etc.)
     */
    async showSessionControls() {
        const modal = document.getElementById('sessionControlsModal');
        if (!modal) return;

        modal.style.display = 'flex';

        // Load participants
        await this.loadParticipants();

        // Load playlist
        await this.loadPlaylist();
    }

    /**
     * Hide session controls
     */
    hideSessionControls() {
        const modal = document.getElementById('sessionControlsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Load and display participants
     */
    async loadParticipants() {
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) return;

        try {
            const participants = await window.sessionManager.getParticipants();

            participantsList.innerHTML = participants.map(p => {
                const statusIcon = p.status === 'connected' ? '🟢' : '⚪';
                const tierBadge = p.tier === 'PRO' ? '👑' : p.tier === 'BASIC' ? '⭐' : '🆓';

                return `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 6px; margin-bottom: 6px;">
                        <span>${statusIcon}</span>
                        <span style="flex: 1; color: var(--text); font-size: 14px;">${p.name}</span>
                        <span style="font-size: 12px;">${tierBadge} ${p.tier}</span>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading participants:', error);
        }
    }

    /**
     * Load and display playlist
     */
    async loadPlaylist() {
        const playlistEl = document.getElementById('sessionPlaylist');
        if (!playlistEl) return;

        try {
            const playlist = await window.sessionManager.getPlaylist();

            if (playlist.length === 0) {
                playlistEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 14px;">No songs in playlist yet</p>';
                return;
            }

            playlistEl.innerHTML = playlist.map((song, index) => {
                return `
                    <div class="playlist-song-item" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 8px; cursor: pointer;"
                         onclick="sessionUI.loadSongFromPlaylist('${song.id}')">
                        <div style="min-width: 24px; text-align: center; color: var(--text-muted); font-size: 13px; font-weight: 600;">
                            ${index + 1}
                        </div>
                        <div style="flex: 1;">
                            <div style="color: var(--text); font-size: 14px; font-weight: 500;">${song.name}</div>
                            <div style="color: var(--text-muted); font-size: 12px;">${song.originalKey}${song.bpm ? ` • ${song.bpm} BPM` : ''}</div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading playlist:', error);
        }
    }

    /**
     * Load song from playlist (callback to be implemented in app.js)
     */
    loadSongFromPlaylist(songId) {
        // This will be handled in app.js
        if (window.onLoadSongFromPlaylist) {
            window.onLoadSongFromPlaylist(songId);
        }
    }

    /**
     * Toggle live mode (players only)
     */
    toggleLiveMode() {
        const inLiveMode = window.sessionManager.toggleLiveMode();

        const button = document.getElementById('toggleLiveModeBtn');
        if (button) {
            button.textContent = inLiveMode ? '📻 Follow Leader: ON' : '📴 Follow Leader: OFF';
            button.style.background = inLiveMode ? '#10b981' : 'rgba(255,255,255,0.1)';
        }

        // Update Return to Live button visibility
        const returnBtn = document.getElementById('returnToLiveBtn');
        if (returnBtn) {
            returnBtn.style.display = inLiveMode ? 'none' : 'inline-block';
        }

        const message = inLiveMode
            ? '📻 Following leader - Your key preferences are saved'
            : '📴 Browse freely - Click "Return to Live" to sync';

        this.showToast(message);

        // If turning ON live mode, load the leader's current song
        if (inLiveMode && window.returnToLeaderSong) {
            window.returnToLeaderSong();
        }
    }

    /**
     * Leave session
     */
    async leaveSession() {
        if (!confirm('Leave this session?')) return;

        try {
            await window.sessionManager.leaveSession();
            this.hideSessionActive();
            this.hideSessionControls();
            this.hideLiveSessionBanner();
            this.showToast('👋 Left session');

        } catch (error) {
            console.error('Error leaving session:', error);
        }
    }

    /**
     * Hide the live session banner
     */
    hideLiveSessionBanner() {
        const banner = document.getElementById('liveSessionBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    /**
     * End session (leader only)
     */
    async endSession() {
        if (!confirm('End this session? All participants will be disconnected.')) return;

        try {
            await window.sessionManager.endSession();
            this.hideSessionActive();
            this.hideSessionControls();
            this.hideLiveSessionBanner();
            this.showToast('🛑 Session ended');

        } catch (error) {
            console.error('Error ending session:', error);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        // Reuse the existing authMessage div for toasts
        const toast = document.getElementById('authMessage');
        if (toast) {
            toast.textContent = message;
            toast.className = 'info';
            toast.style.display = 'block';

            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        } else {
            // Fallback to console if toast element doesn't exist
            console.log(message);
        }
    }

    /**
     * Update session controls visibility based on user role
     */
    updateControlsForRole() {
        const isLeader = window.sessionManager.isLeader;

        // Show/hide leader-only controls
        const leaderControls = document.querySelectorAll('.leader-only');
        leaderControls.forEach(el => {
            el.style.display = isLeader ? 'block' : 'none';
        });

        // Show/hide player-only controls
        const playerControls = document.querySelectorAll('.player-only');
        playerControls.forEach(el => {
            el.style.display = isLeader ? 'none' : 'block';
        });
    }
}

// Initialize and expose globally
const sessionUI = new SessionUI();
window.sessionUI = sessionUI;

console.log('✅ Session UI initialized');
