// aChordim Session UI Manager
// Handles rendering and interaction for live sessions

// --- Relative Key Utilities (Circle of Fifths) ---
function getRelativeKeys(key) {
    if (!key || key === 'Unknown') return null;

    const normalized = key.trim();
    const isMinor = /minor$/i.test(normalized) || (/m$/.test(normalized) && !/Major$/i.test(normalized));
    const root = normalized.replace(/\s*(Major|Minor|m)$/i, '').trim();

    const circle = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const toSharp = { 'Db':'C#','Eb':'D#','Fb':'E','Gb':'F#','Ab':'G#','Bb':'A#','Cb':'B' };
    // Preferred display: use flats where conventional (Bb not A#, Eb not D#, Ab not G#)
    const keyDisplay = { 'A#':'Bb','D#':'Eb','G#':'Ab' };

    const rootNorm = toSharp[root] || root;
    const idx = circle.indexOf(rootNorm);
    if (idx === -1) return null;

    const fourthRaw = circle[(idx + 5) % 12];
    const fifthRaw = circle[(idx + 7) % 12];

    const suffix = isMinor ? 'm' : '';
    const fourthDisplay = keyDisplay[fourthRaw] || fourthRaw;
    const fifthDisplay = keyDisplay[fifthRaw] || fifthRaw;

    return { fourth: fourthDisplay + suffix, fifth: fifthDisplay + suffix };
}

function keysMatch(key1, key2) {
    if (!key1 || !key2) return false;
    const normalize = (k) => {
        let s = k.trim().replace(/\s*Major$/i, '').trim();
        const isMinor = /minor$/i.test(s) || (/m$/.test(s) && !/M$/.test(s));
        const root = s.replace(/\s*(Minor|m)$/i, '').trim();
        const toSharp = { 'Db':'C#','Eb':'D#','Fb':'E','Gb':'F#','Ab':'G#','Bb':'A#','Cb':'B' };
        return (toSharp[root] || root) + (isMinor ? 'm' : '');
    };
    return normalize(key1) === normalize(key2);
}

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
     * @param {boolean} keepPendingSongs - If true, keep pending songs for bulk add
     */
    async showMySessionsModal(keepPendingSongs = false) {
        const modal = document.getElementById('mySessionsModal');
        if (modal) {
            // Clear pending songs unless we're explicitly adding songs
            if (!keepPendingSongs) {
                window.pendingSongToAdd = null;
                window.pendingSongsToAdd = null;
            }
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
        // Clear any pending song(s) to add
        window.pendingSongToAdd = null;
        window.pendingSongsToAdd = null;
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
                    <div class="session-item" style="padding: 16px; background: transparent; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 4px 0; color: var(--text); font-size: 16px; font-weight: 700;">${session.title}</h4>
                                <p style="margin: 0; font-size: 13px; color: var(--text); opacity: 0.7;">${role} • Created ${date}</p>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text); font-family: monospace;">Code: ${session.sessionCode}</p>
                            </div>
                            <div style="display: flex; gap: 8px; flex-direction: column;">
                                ${session.isOwner ? `
                                    <button onclick="sessionUI.addCurrentSongToSession('${session.id}')"
                                            style="padding: 6px 12px; background: var(--text); color: var(--bg); border: none; cursor: pointer; font-size: 12px; white-space: nowrap; font-weight: 600;">
                                        ${window.pendingSongsToAdd && window.pendingSongsToAdd.length > 0
                                            ? `+ Add ${window.pendingSongsToAdd.length} Song${window.pendingSongsToAdd.length > 1 ? 's' : ''}`
                                            : (window.pendingSongToAdd ? '+ Add Selected Song' : '+ Add Current Song')}
                                    </button>
                                    <button onclick="sessionUI.reactivateSession('${session.id}')"
                                            style="padding: 6px 12px; background: var(--text); color: var(--bg); border: none; cursor: pointer; font-size: 12px; font-weight: 600;">
                                        ↻ Reactivate
                                    </button>
                                    <button onclick="sessionUI.manageSession('${session.id}')"
                                            style="padding: 6px 12px; background: transparent; color: var(--text); border: 1px solid var(--border); cursor: pointer; font-size: 12px;">
                                        ⚙ Manage
                                    </button>
                                    <div style="display: flex; gap: 4px;">
                                        <button onclick="sessionUI.editSession('${session.id}', '${session.title.replace(/'/g, "\\'")}')"
                                                style="flex: 1; padding: 6px 8px; background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 11px;"
                                                title="Rename">✎</button>
                                        <button onclick="sessionUI.deleteSession('${session.id}', '${session.title.replace(/'/g, "\\'")}')"
                                                style="flex: 1; padding: 6px 8px; background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 11px;"
                                                title="Delete">✕</button>
                                    </div>
                                ` : `
                                    <button onclick="sessionUI.joinSessionById('${session.id}')"
                                            style="padding: 8px 16px; background: var(--text); color: var(--bg); border: none; cursor: pointer; font-size: 13px; font-weight: 600;">
                                        Rejoin
                                    </button>
                                    <button onclick="sessionUI.removeFromMyList('${session.id}', '${session.title.replace(/'/g, "\\'")}')"
                                            style="padding: 6px 12px; background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 12px; margin-top: 4px;">
                                        ✕ Remove
                                    </button>
                                `}
                            </div>
                        </div>
                        <div style="margin-top: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
                            <button onclick="sessionUI.toggleSessionPlaylist('${session.id}', this, ${session.isOwner})"
                                    style="background: transparent; border: none; color: var(--text); opacity: 0.7; cursor: pointer; font-size: 13px; padding: 4px 0; width: 100%; text-align: left;">
                                ▶ Show Playlist
                            </button>
                            <div id="playlist-${session.id}" style="display: none; margin-top: 8px; max-height: 60vh; overflow-y: auto;">
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
     * Edit session title
     */
    async editSession(sessionId, currentTitle) {
        const newTitle = await window.styledPrompt('Enter new session name:', currentTitle, '✏️ Edit Session Name');
        if (!newTitle || newTitle === currentTitle) return;

        try {
            // Update in both places: the session itself and user's session list
            await firebase.database().ref(`sessions/${sessionId}/metadata/title`).set(newTitle);
            await firebase.database().ref(`users/${firebase.auth().currentUser.uid}/sessions/${sessionId}/title`).set(newTitle);

            this.showToast(`✅ Renamed to "${newTitle}"`);
            await this.loadUserSessions();
        } catch (error) {
            console.error('Error editing session:', error);
            this.showToast('❌ Failed to rename session');
        }
    }

    /**
     * Delete session
     */
    async deleteSession(sessionId, sessionTitle) {
        if (!confirm(`Delete "${sessionTitle}"?\n\nThis will permanently remove the session and all its data.`)) return;

        try {
            // Delete from user's session list
            await firebase.database().ref(`users/${firebase.auth().currentUser.uid}/sessions/${sessionId}`).remove();

            // Delete the session itself (only if user is the leader)
            await firebase.database().ref(`sessions/${sessionId}`).remove();

            this.showToast(`🗑️ "${sessionTitle}" deleted`);
            await this.loadUserSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
            this.showToast('❌ Failed to delete session');
        }
    }

    /**
     * Remove session from user's list (for non-owners)
     */
    async removeFromMyList(sessionId, sessionTitle) {
        if (!confirm(`Remove "${sessionTitle}" from your list?\n\nYou can rejoin later with the session code.`)) return;

        try {
            // Only remove from user's session list, don't delete the actual session
            await firebase.database().ref(`users/${firebase.auth().currentUser.uid}/sessions/${sessionId}`).remove();

            this.showToast(`👋 Removed "${sessionTitle}" from your list`);
            await this.loadUserSessions();
        } catch (error) {
            console.error('Error removing session:', error);
            this.showToast('❌ Failed to remove session');
        }
    }

    /**
     * Toggle session playlist visibility
     */
    async toggleSessionPlaylist(sessionId, button, isOwner = false) {
        const playlistEl = document.getElementById(`playlist-${sessionId}`);
        if (!playlistEl) return;

        const isHidden = playlistEl.style.display === 'none';

        if (isHidden) {
            playlistEl.style.display = 'block';
            button.textContent = '▼ Hide Playlist';
            await this.loadSessionPlaylistInline(sessionId, isOwner);
        } else {
            playlistEl.style.display = 'none';
            button.textContent = '▶ Show Playlist';
        }
    }

    /**
     * Load session playlist inline (in My Sessions modal)
     */
    async loadSessionPlaylistInline(sessionId, isOwner = false) {
        const playlistEl = document.getElementById(`playlist-${sessionId}`);
        if (!playlistEl) return;

        playlistEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 12px;">Loading...</p>';

        try {
            const snapshot = await firebase.database().ref(`sessions/${sessionId}/playlist`).once('value');
            const playlistData = snapshot.val() || {};

            const playlist = Object.entries(playlistData)
                .map(([id, data]) => ({ id, ...data }))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            if (playlist.length === 0) {
                playlistEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 12px;">No songs yet</p>';
                return;
            }

            playlistEl.innerHTML = playlist.map((song, index) => {
                const currentKey = song.originalKey || song.key;
                const nextSong = playlist[index + 1];
                const nextKey = nextSong ? (nextSong.originalKey || nextSong.key) : null;
                const relatives = getRelativeKeys(currentKey);

                let hintHtml = '';
                if (index < playlist.length - 1 && relatives) {
                    if (nextKey) {
                        const isFourth = keysMatch(nextKey, relatives.fourth);
                        const isFifth = keysMatch(nextKey, relatives.fifth);
                        if (isFourth || isFifth) {
                            hintHtml = `<div style="padding: 6px 8px 6px 28px; font-size: 10px; opacity: 0.6; color: var(--text);">\u2192 \u2713 smooth (${isFourth ? 'IV' : 'V'})</div>`;
                        } else {
                            hintHtml = `<div style="padding: 6px 8px 6px 28px; font-size: 10px; opacity: 0.4; color: var(--text);">\u2192 suggest: ${relatives.fourth}, ${relatives.fifth}</div>`;
                        }
                    } else {
                        hintHtml = `<div style="padding: 6px 8px 6px 28px; font-size: 10px; opacity: 0.4; color: var(--text);">\u2192 suggest: ${relatives.fourth}, ${relatives.fifth}</div>`;
                    }
                }

                return `
                <div class="playlist-drag-item" data-index="${index}" data-session="${sessionId}" ${isOwner ? 'draggable="true"' : ''} style="display: flex; align-items: center; gap: 6px; padding: 8px; background: transparent; border: 1px solid var(--border); margin-bottom: 4px; font-size: 12px; ${isOwner ? 'cursor: grab;' : ''}">
                    <span style="color: var(--text); opacity: 0.6; min-width: 20px;">${index + 1}.</span>
                    <span style="flex: 1; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${song.name}</span>
                    <span style="color: var(--text); opacity: 0.6; font-size: 10px;">${currentKey || ''}</span>
                    ${isOwner ? `
                        <div style="display: flex; gap: 2px;">
                            ${index > 0 ? `<button onclick="sessionUI.moveSessionSong('${sessionId}', '${song.id}', -1)" style="padding: 2px 4px; background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 10px;" title="Move up">↑</button>` : ''}
                            ${index < playlist.length - 1 ? `<button onclick="sessionUI.moveSessionSong('${sessionId}', '${song.id}', 1)" style="padding: 2px 4px; background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 10px;" title="Move down">↓</button>` : ''}
                            <button onclick="sessionUI.editSessionSong('${sessionId}', '${song.id}', '${song.name.replace(/'/g, "\\'")}')" style="padding: 2px 4px; background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 10px;" title="Edit">✎</button>
                            <button onclick="sessionUI.deleteSessionSong('${sessionId}', '${song.id}', '${song.name.replace(/'/g, "\\'")}')" style="padding: 2px 4px; background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 10px;" title="Delete">✕</button>
                        </div>
                    ` : ''}
                </div>
                ${hintHtml}`;
            }).join('');

            // Set up drag-and-drop for owner
            if (isOwner) {
                this._setupPlaylistDragDrop(playlistEl, sessionId);
            }

        } catch (error) {
            console.error('Error loading session playlist:', error);
            playlistEl.innerHTML = '<p style="text-align: center; color: var(--text); font-size: 12px;">Error loading playlist</p>';
        }
    }

    /**
     * Edit song in session playlist
     */
    async editSessionSong(sessionId, songId, currentName) {
        const newName = await window.styledPrompt('Enter new song name:', currentName, '✏️ Edit Song Name');
        if (!newName || newName === currentName) return;

        try {
            await firebase.database().ref(`sessions/${sessionId}/playlist/${songId}/name`).set(newName);
            this.showToast(`✅ Renamed to "${newName}"`);
            await this.loadSessionPlaylistInline(sessionId, true);
        } catch (error) {
            console.error('Error editing song:', error);
            this.showToast('❌ Failed to edit song');
        }
    }

    /**
     * Delete song from session playlist
     */
    async deleteSessionSong(sessionId, songId, songName) {
        if (!confirm(`Delete "${songName}" from playlist?`)) return;

        try {
            await firebase.database().ref(`sessions/${sessionId}/playlist/${songId}`).remove();
            this.showToast(`🗑️ "${songName}" removed`);
            await this.loadSessionPlaylistInline(sessionId, true);
        } catch (error) {
            console.error('Error deleting song:', error);
            this.showToast('❌ Failed to delete song');
        }
    }

    /**
     * Move song up or down in session playlist
     */
    async moveSessionSong(sessionId, songId, direction) {
        try {
            // Get current playlist
            const snapshot = await firebase.database().ref(`sessions/${sessionId}/playlist`).once('value');
            const playlistData = snapshot.val() || {};

            const playlist = Object.entries(playlistData)
                .map(([id, data]) => ({ id, ...data }))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // Find current index
            const currentIndex = playlist.findIndex(s => s.id === songId);
            if (currentIndex === -1) return;

            const newIndex = currentIndex + direction;
            if (newIndex < 0 || newIndex >= playlist.length) return;

            // Swap orders
            const currentOrder = playlist[currentIndex].order || currentIndex;
            const swapOrder = playlist[newIndex].order || newIndex;

            await firebase.database().ref(`sessions/${sessionId}/playlist/${songId}/order`).set(swapOrder);
            await firebase.database().ref(`sessions/${sessionId}/playlist/${playlist[newIndex].id}/order`).set(currentOrder);

            await this.loadSessionPlaylistInline(sessionId, true);
        } catch (error) {
            console.error('Error moving song:', error);
            this.showToast('❌ Failed to move song');
        }
    }

    /**
     * Reorder song in session playlist (drag-drop: move from one index to another)
     */
    async reorderSessionSong(sessionId, fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        try {
            const snapshot = await firebase.database().ref(`sessions/${sessionId}/playlist`).once('value');
            const playlistData = snapshot.val() || {};

            const playlist = Object.entries(playlistData)
                .map(([id, data]) => ({ id, ...data }))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // Remove item from old position and insert at new position
            const [moved] = playlist.splice(fromIndex, 1);
            playlist.splice(toIndex, 0, moved);

            // Update all order values in Firebase
            const updates = {};
            playlist.forEach((song, idx) => {
                updates[`${song.id}/order`] = idx;
            });
            await firebase.database().ref(`sessions/${sessionId}/playlist`).update(updates);

            await this.loadSessionPlaylistInline(sessionId, true);
        } catch (error) {
            console.error('Error reordering song:', error);
            this.showToast('\u274c Failed to reorder');
        }
    }

    /**
     * Set up drag-and-drop event listeners on playlist items
     */
    _setupPlaylistDragDrop(container, sessionId) {
        let dragFromIndex = null;

        // Find closest drag item from any element (handles drops on hint rows too)
        const getClosestItem = (el) => {
            while (el && el !== container) {
                if (el.classList && el.classList.contains('playlist-drag-item')) return el;
                el = el.parentElement;
            }
            return null;
        };

        const clearIndicators = () => {
            container.querySelectorAll('.playlist-drag-item').forEach(el => {
                el.style.borderTop = '';
                el.style.borderBottom = '';
            });
        };

        // Dragstart on each item
        container.querySelectorAll('.playlist-drag-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                dragFromIndex = parseInt(item.dataset.index);
                setTimeout(() => { item.style.opacity = '0.4'; }, 0);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(dragFromIndex));
            });

            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                dragFromIndex = null;
                clearIndicators();
            });
        });

        // Dragover and drop on container (catches drops on hint rows too)
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragFromIndex === null) return;

            clearIndicators();
            const target = getClosestItem(e.target);
            if (!target) return;

            const targetIndex = parseInt(target.dataset.index);
            if (targetIndex < dragFromIndex) {
                target.style.borderTop = '2px solid var(--text)';
            } else if (targetIndex > dragFromIndex) {
                target.style.borderBottom = '2px solid var(--text)';
            }
        });

        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                clearIndicators();
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            clearIndicators();
            if (dragFromIndex === null) return;

            const target = getClosestItem(e.target);
            if (!target) return;

            const toIndex = parseInt(target.dataset.index);
            if (dragFromIndex !== toIndex) {
                sessionUI.reorderSessionSong(sessionId, dragFromIndex, toIndex);
            }
            dragFromIndex = null;
        });
    }

    /**
     * Create session handler
     */
    async handleCreateSession() {
        const titleInput = document.getElementById('sessionTitleInput');
        const title = titleInput.value.trim();

        if (!title) {
            this.showToast('Please enter a session title');
            return;
        }

        try {
            const { sessionId, sessionCode } = await window.sessionManager.createSession(title);
            this.currentSessionCode = sessionCode;

            this.hideCreateSessionModal();
            this.showSessionActive(sessionCode, true);

            this.showToast(`✅ Session created! Share code: ${sessionCode}`);

        } catch (error) {
            console.error('Error creating session:', error);
            this.showToast('❌ ' + error.message);
        }
    }

    /**
     * Join session handler
     */
    async handleJoinSession() {
        const codeInput = document.getElementById('sessionCodeInput');
        const sessionCode = codeInput.value.trim().toUpperCase();

        if (!sessionCode) {
            this.showToast('Please enter a session code');
            return;
        }

        try {
            const { sessionId, session } = await window.sessionManager.joinSession(sessionCode);
            this.currentSessionCode = sessionCode;

            this.hideJoinSessionModal();
            this.showSessionActive(sessionCode, false);

            this.showToast(`✅ Joined session: ${session.metadata.title}`);

        } catch (error) {
            console.error('Error joining session:', error);
            this.showToast('❌ ' + error.message);
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

            this.showToast(`✅ Session reactivated: ${session.metadata.title}`);

            // Automatically enter Live Mode
            if (window.liveMode) {
                setTimeout(() => {
                    window.liveMode.enter();
                    console.log('🎸 Auto-entered Live Mode after reactivating session');
                }, 300);
            }

        } catch (error) {
            console.error('Error reactivating session:', error);
            this.showToast('❌ ' + error.message);
        }
    }

    /**
     * Open session manager modal for a specific session
     */
    async manageSession(sessionId) {
        if (!window.liveMode) {
            this.showToast('❌ Live Mode not available');
            return;
        }

        // Open the session manager modal with the specific session ID
        await window.liveMode.openSessionManager(sessionId);
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

            this.showToast(`✅ Rejoined session: ${session.metadata.title}`);

        } catch (error) {
            console.error('Error joining session:', error);
            this.showToast('❌ ' + error.message);
        }
    }

    /**
     * Add current song to a session's playlist
     */
    async addCurrentSongToSession(sessionId) {
        try {
            let songData;
            let defaultName = '';

            // Check if there are MULTIPLE pending songs from bulk selection
            if (window.pendingSongsToAdd && window.pendingSongsToAdd.length > 0) {
                const songs = window.pendingSongsToAdd;
                const count = songs.length;

                // Confirm bulk add
                if (!confirm(`Add ${count} song${count > 1 ? 's' : ''} to this session?`)) {
                    window.pendingSongsToAdd = null;
                    return;
                }

                // Get current playlist to determine starting order
                const playlistSnapshot = await firebase.database().ref(`sessions/${sessionId}/playlist`).once('value');
                const playlist = playlistSnapshot.val() || {};
                let order = Object.keys(playlist).length;

                let successCount = 0;
                for (const song of songs) {
                    try {
                        const songId = `song_${Date.now()}_${successCount}`;
                        const playlistRef = firebase.database().ref(`sessions/${sessionId}/playlist/${songId}`);

                        await playlistRef.set({
                            name: song.title || song.name || 'Untitled',
                            content: song.content || '',
                            originalKey: song.originalKey || 'Unknown',
                            bpm: song.bpm || null,
                            addedAt: Date.now(),
                            order: order++
                        });
                        successCount++;
                    } catch (error) {
                        console.error('Error adding song:', song.name, error);
                    }
                }

                window.pendingSongsToAdd = null;
                this.showToast(`✅ Added ${successCount} song${successCount > 1 ? 's' : ''} to session`);

                // Refresh playlist if visible
                const playlistEl = document.getElementById(`playlist-${sessionId}`);
                if (playlistEl && playlistEl.style.display !== 'none') {
                    await this.loadSessionPlaylist(sessionId, playlistEl);
                }
                return;
            }

            // Check if there's a SINGLE pending song from library
            if (window.pendingSongToAdd) {
                // Use the pending song data
                defaultName = window.pendingSongToAdd.name || '';
                const songName = await window.styledPrompt('Enter song name:', defaultName, '🎵 Add Song to Session');
                if (!songName) {
                    window.pendingSongToAdd = null; // Clear pending
                    return;
                }

                songData = {
                    id: `song_${Date.now()}`,
                    name: songName,
                    content: window.pendingSongToAdd.content || '',
                    originalKey: window.pendingSongToAdd.originalKey || 'Unknown',
                    bpm: window.pendingSongToAdd.bpm || null
                };

                // Clear pending song after use
                window.pendingSongToAdd = null;
            } else {
                // Get current song data from the editor
                const visualEditor = document.getElementById('visualEditor');
                const keySelector = document.getElementById('keySelector');
                const bpmInput = document.getElementById('bpmInput');

                // Check if there's a song loaded
                if (!visualEditor || !visualEditor.value.trim()) {
                    this.showToast('⚠️ No song loaded. Please analyze or load a song first.');
                    return;
                }

                // Get song name - pre-fill with current name but allow editing
                defaultName = window.currentSongName || '';
                const songName = await window.styledPrompt('Enter song name:', defaultName, '🎵 Add Song to Session');
                if (!songName) return;

                // Prepare song data
                songData = {
                    id: `song_${Date.now()}`,
                    name: songName,
                    content: visualEditor.value,
                    originalKey: keySelector ? keySelector.value : 'Unknown',
                    bpm: bpmInput ? parseInt(bpmInput.value) || null : null
                };
            }

            // Add to session playlist
            const playlistRef = firebase.database().ref(`sessions/${sessionId}/playlist/${songData.id}`);

            // Get current playlist to determine order
            const playlistSnapshot = await firebase.database().ref(`sessions/${sessionId}/playlist`).once('value');
            const playlist = playlistSnapshot.val() || {};
            const order = Object.keys(playlist).length;

            await playlistRef.set({
                name: songData.name,
                content: songData.content,
                originalKey: songData.originalKey,
                bpm: songData.bpm,
                addedAt: Date.now(),
                order: order
            });

            this.showToast(`✅ "${songData.name}" added to session playlist`);

            // Refresh playlist if visible
            const playlistEl = document.getElementById(`playlist-${sessionId}`);
            if (playlistEl && playlistEl.style.display !== 'none') {
                await this.loadSessionPlaylistInline(sessionId, true);
            }

        } catch (error) {
            console.error('Error adding song to session:', error);
            this.showToast('❌ ' + error.message);
        }
    }

    /**
     * Show session active indicator
     */
    showSessionActive(sessionCode, isLeader) {
        const indicator = document.getElementById('sessionStatusIndicator');
        if (!indicator) return;

        // Leader gets Share and Singers buttons
        const leaderButtons = isLeader ? `
            <button onclick="sessionUI.showShareBadge('${sessionCode}')"
                    style="padding: 6px 12px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 6px; color: #60a5fa; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                <span>🔗</span> Share
            </button>
        ` : '';

        indicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; flex-wrap: wrap;">
                <span style="font-size: 20px;">${isLeader ? '📡' : '📻'}</span>
                <div style="flex: 1; min-width: 150px;">
                    <div style="font-weight: 600; color: #10b981; font-size: 14px;">
                        ${isLeader ? 'Broadcasting' : 'Connected'} • ${sessionCode}
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted);">
                        ${isLeader ? 'You are the session leader' : 'Following session leader'}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${leaderButtons}
                    <button onclick="sessionUI.showSessionControls()"
                            style="padding: 6px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: var(--text); cursor: pointer; font-size: 12px;">
                        Options
                    </button>
                </div>
            </div>
        `;

        indicator.style.display = 'block';

        // Update side menu session info
        this.updateSideMenuSession(sessionCode, isLeader);
    }

    /**
     * Update side menu with session info (QR code, link)
     */
    updateSideMenuSession(sessionCode, isLeader) {
        const sideMenuSection = document.getElementById('sideMenuActiveSession');
        const codeDisplay = document.getElementById('sideMenuSessionCode');
        const qrContainer = document.getElementById('sideMenuQRCode');
        const linkInput = document.getElementById('sideMenuSessionLink');
        const copyBtn = document.getElementById('sideMenuCopyLink');

        if (!sideMenuSection) return;

        if (!sessionCode) {
            sideMenuSection.style.display = 'none';
            return;
        }

        // Show section
        sideMenuSection.style.display = 'block';

        // Display session code
        if (codeDisplay) {
            codeDisplay.textContent = sessionCode;
        }

        // Generate shareable link
        const baseUrl = window.location.origin + window.location.pathname;
        const joinLink = `${baseUrl}?join=${sessionCode}`;

        if (linkInput) {
            linkInput.value = joinLink;
        }

        // Generate QR code
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = ''; // Clear previous
            new QRCode(qrContainer, {
                text: joinLink,
                width: 120,
                height: 120,
                colorDark: '#10b981',
                colorLight: '#ffffff'
            });
        }

        // Copy button handler
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(joinLink);
                this.showToast('📋 Link copied!');
            };
        }

        // Also allow clicking the link input to copy
        if (linkInput) {
            linkInput.onclick = () => {
                linkInput.select();
                navigator.clipboard.writeText(joinLink);
                this.showToast('📋 Link copied!');
            };
        }
    }

    /**
     * Hide session active indicator
     */
    hideSessionActive() {
        const indicator = document.getElementById('sessionStatusIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }

        // Also hide side menu session info
        const sideMenuSection = document.getElementById('sideMenuActiveSession');
        if (sideMenuSection) {
            sideMenuSection.style.display = 'none';
        }
    }

    /**
     * Show share badge modal with QR code and links
     */
    async showShareBadge(sessionCode) {
        // Remove existing modal if any
        const existingModal = document.getElementById('shareBadgeModal');
        if (existingModal) existingModal.remove();

        const baseUrl = window.location.origin + window.location.pathname;
        const joinLink = `${baseUrl}?join=${sessionCode}`;
        const singerLink = `${baseUrl}?singer=${sessionCode}`;

        // Get current singers status
        const allowSingers = window.sessionManager ? window.sessionManager.getAllowSingers() : false;

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'shareBadgeModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000; padding: 20px;
        `;

        modal.innerHTML = `
            <div style="background: #1e1e2e; border-radius: 16px; padding: 24px; max-width: 400px; width: 100%; position: relative; border: 1px solid rgba(255,255,255,0.15);">
                <button onclick="document.getElementById('shareBadgeModal').remove()"
                        style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: #888; font-size: 24px; cursor: pointer; line-height: 1;">
                    &times;
                </button>

                <h3 style="margin: 0 0 20px 0; text-align: center; color: #ffffff; font-size: 18px; font-weight: 600;">
                    Share Session
                </h3>

                <!-- Session Code -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 32px; font-weight: bold; font-family: monospace; color: #10b981; letter-spacing: 4px;">
                        ${sessionCode}
                    </div>
                </div>

                <!-- QR Code -->
                <div id="shareBadgeQR" style="display: flex; justify-content: center; margin-bottom: 20px; background: white; padding: 12px; border-radius: 8px;"></div>

                <!-- Join Link -->
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 12px; color: #9ca3af; margin-bottom: 6px;">Join Link (Players)</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" value="${joinLink}" readonly
                               style="flex: 1; padding: 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; background: rgba(255,255,255,0.08); color: #e5e5e5; font-size: 12px;">
                        <button onclick="navigator.clipboard.writeText('${joinLink}'); sessionUI.showToast('📋 Join link copied!')"
                                style="padding: 10px 16px; background: #10b981; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 12px; white-space: nowrap;">
                            Copy
                        </button>
                    </div>
                </div>

                <!-- Allow Singers Toggle -->
                <div style="margin-bottom: 16px; padding: 12px; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 8px;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="shareBadgeSingersToggle" ${allowSingers ? 'checked' : ''}
                               onchange="sessionUI.handleShareBadgeSingerToggle(this.checked, '${sessionCode}')"
                               style="width: 18px; height: 18px; cursor: pointer;">
                        <div>
                            <div style="font-size: 14px; color: #e5e5e5;">Allow Singers</div>
                            <div style="font-size: 11px; color: #9ca3af;">Lyrics only, no account needed</div>
                        </div>
                    </label>
                </div>

                <!-- Singer Link (shown when enabled) -->
                <div id="shareBadgeSingerSection" style="margin-bottom: 16px; display: ${allowSingers ? 'block' : 'none'};">
                    <label style="display: block; font-size: 12px; color: #a78bfa; margin-bottom: 6px;">Singer Link (Lyrics only)</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" value="${singerLink}" readonly id="shareBadgeSingerLink"
                               style="flex: 1; padding: 10px; border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 6px; background: rgba(139, 92, 246, 0.15); color: #e5e5e5; font-size: 12px;">
                        <button onclick="navigator.clipboard.writeText('${singerLink}'); sessionUI.showToast('🎤 Singer link copied!')"
                                style="padding: 10px 16px; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 12px; white-space: nowrap;">
                            Copy
                        </button>
                    </div>
                </div>

                <!-- Close Button -->
                <button onclick="document.getElementById('shareBadgeModal').remove()"
                        style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #e5e5e5; cursor: pointer; font-size: 14px; margin-top: 8px;">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Generate QR code
        const qrContainer = document.getElementById('shareBadgeQR');
        if (qrContainer && typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: joinLink,
                width: 150,
                height: 150,
                colorDark: '#10b981',
                colorLight: '#ffffff'
            });
        }

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Handle singer toggle from share badge
     */
    async handleShareBadgeSingerToggle(allow, sessionCode) {
        if (window.sessionManager) {
            await window.sessionManager.toggleAllowSingers(allow);
        }

        // Show/hide singer section
        const singerSection = document.getElementById('shareBadgeSingerSection');
        if (singerSection) {
            singerSection.style.display = allow ? 'block' : 'none';
        }

        this.showToast(allow ? '🎤 Singers enabled!' : '🎤 Singers disabled');
    }

    /**
     * Show session controls (participants, playlist, etc.)
     */
    async showSessionControls() {
        const modal = document.getElementById('sessionControlsModal');
        if (!modal) return;

        modal.style.display = 'flex';

        // Update controls visibility based on role (leader vs player)
        this.updateControlsForRole();

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

            // Separate singers and regular participants
            const singers = participants.filter(p => p.type === 'singer');
            const regulars = participants.filter(p => p.type !== 'singer');

            let html = '';

            // Regular participants
            html += regulars.map(p => {
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

            // Singers section (if any)
            if (singers.length > 0) {
                html += `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">🎤 Singers (${singers.length})</div>
                        ${singers.map(p => {
                            const statusIcon = p.status === 'connected' ? '🟢' : '⚪';
                            return `
                                <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: rgba(139, 92, 246, 0.1); border-radius: 6px; margin-bottom: 4px;">
                                    <span>${statusIcon}</span>
                                    <span style="flex: 1; color: var(--text); font-size: 13px; opacity: 0.8;">${p.name}</span>
                                    <span style="font-size: 11px; color: #8b5cf6;">Lyrics only</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            participantsList.innerHTML = html;

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

            const isLeader = window.sessionManager && window.sessionManager.isLeader;

            playlistEl.innerHTML = playlist.map((song, index) => {
                const currentKey = song.originalKey || song.key;
                const nextSong = playlist[index + 1];
                const nextKey = nextSong ? (nextSong.originalKey || nextSong.key) : null;
                const relatives = getRelativeKeys(currentKey);

                let hintHtml = '';
                if (index < playlist.length - 1 && relatives) {
                    if (nextKey) {
                        const isFourth = keysMatch(nextKey, relatives.fourth);
                        const isFifth = keysMatch(nextKey, relatives.fifth);
                        if (isFourth || isFifth) {
                            hintHtml = `<div style="padding: 6px 8px 6px 32px; font-size: 11px; opacity: 0.6; color: var(--text);">\u2192 \u2713 smooth (${isFourth ? 'IV' : 'V'})</div>`;
                        } else {
                            hintHtml = `<div style="padding: 6px 8px 6px 32px; font-size: 11px; opacity: 0.4; color: var(--text);">\u2192 suggest: ${relatives.fourth}, ${relatives.fifth}</div>`;
                        }
                    } else {
                        hintHtml = `<div style="padding: 6px 8px 6px 32px; font-size: 11px; opacity: 0.4; color: var(--text);">\u2192 suggest: ${relatives.fourth}, ${relatives.fifth}</div>`;
                    }
                }

                return `
                    <div class="playlist-song-item playlist-drag-item" data-index="${index}" ${isLeader ? 'draggable="true"' : ''} style="display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 8px; ${isLeader ? 'cursor: grab;' : ''}">
                        <div style="min-width: 24px; text-align: center; color: var(--text-muted); font-size: 13px; font-weight: 600;">
                            ${index + 1}
                        </div>
                        <div style="flex: 1; cursor: pointer;" onclick="sessionUI.loadSongFromPlaylist('${song.id}')">
                            <div style="color: var(--text); font-size: 14px; font-weight: 500;">${song.name}</div>
                            <div style="color: var(--text-muted); font-size: 12px;">${currentKey || ''}${song.bpm ? ` \u2022 ${song.bpm} BPM` : ''}</div>
                        </div>
                        ${isLeader ? `
                            <button onclick="event.stopPropagation(); sessionUI.editPlaylistSong('${song.id}', '${song.name.replace(/'/g, "\\'")}');"
                                    style="padding: 6px 8px; background: rgba(59, 130, 246, 0.2); border: none; border-radius: 4px; color: #3b82f6; cursor: pointer; font-size: 12px;"
                                    title="Edit name">✏️</button>
                            <button onclick="event.stopPropagation(); sessionUI.deletePlaylistSong('${song.id}', '${song.name.replace(/'/g, "\\'")}');"
                                    style="padding: 6px 8px; background: rgba(239, 68, 68, 0.2); border: none; border-radius: 4px; color: #ef4444; cursor: pointer; font-size: 12px;"
                                    title="Delete">🗑️</button>
                        ` : ''}
                    </div>
                    ${hintHtml}
                `;
            }).join('');

            // Set up drag-and-drop for leader
            if (isLeader && window.sessionManager && window.sessionManager.activeSession) {
                this._setupPlaylistDragDrop(playlistEl, window.sessionManager.activeSession.id);
            }

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
     * Edit song name in playlist (LEADER only)
     */
    async editPlaylistSong(songId, currentName) {
        if (!window.sessionManager || !window.sessionManager.isLeader) return;

        const newName = await window.styledPrompt('Enter new song name:', currentName, '✏️ Edit Song Name');
        if (!newName || newName === currentName) return;

        try {
            const sessionId = window.sessionManager.activeSession;
            await firebase.database().ref(`sessions/${sessionId}/playlist/${songId}/name`).set(newName);
            this.showToast(`✅ Renamed to "${newName}"`);
            await this.loadPlaylist();
        } catch (error) {
            console.error('Error editing song:', error);
            this.showToast('❌ Failed to edit song');
        }
    }

    /**
     * Delete song from playlist (LEADER only)
     */
    async deletePlaylistSong(songId, songName) {
        if (!window.sessionManager || !window.sessionManager.isLeader) return;

        if (!confirm(`Delete "${songName}" from playlist?`)) return;

        try {
            await window.sessionManager.removeSongFromPlaylist(songId);
            this.showToast(`🗑️ "${songName}" removed`);
            await this.loadPlaylist();
        } catch (error) {
            console.error('Error deleting song:', error);
            this.showToast('❌ Failed to delete song');
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
            toast.style.background = 'var(--text)';
            toast.style.color = 'var(--bg)';
            toast.style.border = '1px solid var(--border)';

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
            const displayType = el.dataset.display || 'block';
            el.style.display = isLeader ? displayType : 'none';
        });

        // Show/hide player-only controls
        const playerControls = document.querySelectorAll('.player-only');
        playerControls.forEach(el => {
            const displayType = el.dataset.display || 'block';
            el.style.display = isLeader ? 'none' : displayType;
        });

        // Update singer toggle if leader
        if (isLeader) {
            this.updateSingerToggle();
        }
    }

    /**
     * Update singer toggle UI (leader only)
     */
    async updateSingerToggle() {
        const singerToggleContainer = document.getElementById('singerToggleContainer');
        if (!singerToggleContainer) return;

        const allowSingers = await window.sessionManager.getAllowSingers();
        const sessionCode = window.sessionManager.activeSession ?
            (await firebase.database().ref(`sessions/${window.sessionManager.activeSession}/metadata/sessionCode`).once('value')).val() : null;

        // Generate singer link
        const baseUrl = window.location.origin + window.location.pathname;
        const singerLink = sessionCode ? `${baseUrl}?singer=${sessionCode}` : '';

        singerToggleContainer.innerHTML = `
            <div style="padding: 12px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: ${allowSingers ? '12px' : '0'};">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                        <input type="checkbox" id="allowSingersCheckbox" ${allowSingers ? 'checked' : ''}
                               onchange="sessionUI.handleSingerToggle(this.checked)"
                               style="width: 18px; height: 18px; accent-color: #8b5cf6;">
                        <span style="color: var(--text); font-size: 14px;">🎤 Allow Singers</span>
                    </label>
                    <span style="font-size: 12px; color: var(--text-muted);">Lyrics only, no account</span>
                </div>
                ${allowSingers ? `
                    <div style="background: rgba(0,0,0,0.2); border-radius: 6px; padding: 8px;">
                        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Singer Link:</div>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" value="${singerLink}" readonly
                                   style="flex: 1; padding: 6px 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: var(--text); font-size: 12px; font-family: monospace;"
                                   onclick="this.select(); navigator.clipboard.writeText(this.value); sessionUI.showToast('📋 Singer link copied!');">
                            <button onclick="navigator.clipboard.writeText('${singerLink}'); sessionUI.showToast('📋 Singer link copied!');"
                                    style="padding: 6px 12px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap;">
                                Copy
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Handle singer toggle change
     */
    async handleSingerToggle(allow) {
        try {
            await window.sessionManager.toggleAllowSingers(allow);
            this.showToast(allow ? '🎤 Singers enabled' : '🎤 Singers disabled');
            await this.updateSingerToggle();
        } catch (error) {
            console.error('Error toggling singers:', error);
            this.showToast('❌ Failed to update singer settings');
        }
    }

    /**
     * Add current song to session playlist (Leader only)
     */
    async addCurrentSongToPlaylist() {
        if (!window.sessionManager || !window.sessionManager.isLeader) {
            this.showToast('❌ Only session leader can add songs');
            return;
        }

        const visualEditor = document.getElementById('visualEditor');
        const keySelector = document.getElementById('keySelector');
        const bpmInput = document.getElementById('bpmInput');

        if (!visualEditor || !visualEditor.value.trim()) {
            this.showToast('❌ No song loaded in editor');
            return;
        }

        const songData = {
            id: `song_${Date.now()}`,
            name: window.currentSongName || 'Untitled',
            content: visualEditor.value,
            originalKey: keySelector ? keySelector.value : 'C Major',
            bpm: bpmInput ? parseInt(bpmInput.value) || null : null
        };

        try {
            await window.sessionManager.addSongToPlaylist(songData);
            this.showToast('✅ Added to playlist');
            await this.loadPlaylist();
        } catch (error) {
            console.error('Error adding song to playlist:', error);
            this.showToast('❌ Failed to add song');
        }
    }

    /**
     * Show songbook to add songs to playlist (Leader only)
     */
    showAddFromSongbook() {
        if (!window.sessionManager || !window.sessionManager.isLeader) {
            this.showToast('❌ Only session leader can add songs');
            return;
        }

        // Set flag to indicate we're adding to playlist
        window.addingToSessionPlaylist = true;

        // Close session controls modal
        this.hideSessionControls();

        // Open the load song modal
        const loadSongModal = document.getElementById('loadSongModal');
        if (loadSongModal) {
            loadSongModal.style.display = 'flex';
            // Trigger loading songs if needed
            const sideMenuLoad = document.getElementById('sideMenuLoad');
            if (sideMenuLoad) {
                sideMenuLoad.click();
            }
        }
    }
}

// Initialize and expose globally
const sessionUI = new SessionUI();
window.sessionUI = sessionUI;

// Expose loadUserSessions for song-library.js to call
window.loadMySessions = async function() {
    await sessionUI.loadUserSessions();
};

// Filter sessions list by title
window.filterSessionsList = function(searchText) {
    const sessionsList = document.getElementById('sessionsList');
    if (!sessionsList) return;

    const sessionItems = sessionsList.querySelectorAll('.session-item');
    const searchLower = searchText.toLowerCase().trim();

    sessionItems.forEach(item => {
        const titleEl = item.querySelector('h4');
        const title = titleEl ? titleEl.textContent.toLowerCase() : '';

        if (searchLower === '' || title.includes(searchLower)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
};

console.log('✅ Session UI initialized');
