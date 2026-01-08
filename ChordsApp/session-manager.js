// aChordim Live Session Manager
// Handles real-time collaboration between leaders (PRO) and players (BASIC+)

class SessionManager {
    constructor() {
        this.currentUser = null;
        this.activeSession = null;
        this.isLeader = false;
        this.isSinger = false; // Singer mode (anonymous, lyrics only)
        this.listeners = [];
        this.inLiveMode = true; // Players follow leader by default
        this.localTransposeMap = {}; // { songId: transposeSteps } - user's transpose per song
        this.leaderCurrentSong = null; // Cache of leader's current song
        this.database = firebase.database();
    }

    /**
     * Initialize with current user
     */
    async init(user) {
        this.currentUser = user;
        if (!user) {
            this.cleanup();
        }
    }

    /**
     * Generate a random 6-character session code (e.g., "A3F-7K2")
     */
    generateSessionCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
        let code = '';
        for (let i = 0; i < 6; i++) {
            if (i === 3) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Create a new session (PRO only)
     * @param {string} title - Session title (e.g., "Sunday Worship Set 14.11.25")
     * @returns {Promise<{sessionId: string, sessionCode: string}>}
     */
    async createSession(title) {
        if (!this.currentUser) {
            throw new Error('Must be logged in to create a session');
        }

        // Check if user is PRO (this check should be done in UI, but double-check here)
        if (!window.subscriptionManager || window.subscriptionManager.getCurrentTier() !== 'PRO') {
            throw new Error('Only PRO users can create sessions');
        }

        const sessionCode = this.generateSessionCode();
        const sessionId = `session_${Date.now()}_${this.currentUser.uid.substring(0, 8)}`;

        const sessionData = {
            metadata: {
                title: title,
                leaderId: this.currentUser.uid,
                leaderName: this.currentUser.displayName || this.currentUser.email,
                sessionCode: sessionCode,
                createdAt: Date.now(),
                status: 'active',
                allowSingers: false // Leader can enable to allow anonymous singers
            },
            currentSong: null,
            playlist: {},
            participants: {}
        };

        // Save to /sessions/{sessionId}
        await this.database.ref(`sessions/${sessionId}`).set(sessionData);

        // Save to user's session list
        await this.database.ref(`users/${this.currentUser.uid}/sessions/${sessionId}`).set({
            title: title,
            sessionCode: sessionCode,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            isOwner: true
        });

        // Set as active session
        this.activeSession = sessionId;
        this.isLeader = true;

        // Add leader as participant
        await this.joinAsParticipant(sessionId);

        console.log(`✅ Created session: ${title} (Code: ${sessionCode})`);

        return { sessionId, sessionCode };
    }

    /**
     * Join a session by code (BASIC+ only)
     * @param {string} sessionCode - 6-character code (e.g., "A3F-7K2")
     */
    async joinSession(sessionCode) {
        if (!this.currentUser) {
            throw new Error('Must be logged in to join a session');
        }

        // Check if user is BASIC or PRO
        if (!window.subscriptionManager || !window.subscriptionManager.canSaveSongs()) {
            throw new Error('Only BASIC or PRO users can join sessions');
        }

        // Find session by code
        const sessionsRef = this.database.ref('sessions');
        const snapshot = await sessionsRef.orderByChild('metadata/sessionCode').equalTo(sessionCode).once('value');

        if (!snapshot.exists()) {
            throw new Error('Session not found. Check the code and try again.');
        }

        const sessionData = snapshot.val();
        const sessionId = Object.keys(sessionData)[0];
        const session = sessionData[sessionId];

        if (session.metadata.status !== 'active') {
            throw new Error('This session has ended');
        }

        // Start listening to session updates (must be before setting activeSession, as it calls cleanup())
        this.listenToSessionUpdates(sessionId);

        // Set as active session (after listenToSessionUpdates which calls cleanup())
        this.activeSession = sessionId;
        this.isLeader = (session.metadata.leaderId === this.currentUser.uid);
        this.inLiveMode = true; // Start in live mode

        // Add as participant
        await this.joinAsParticipant(sessionId);

        // Save to user's joined sessions
        await this.database.ref(`users/${this.currentUser.uid}/sessions/${sessionId}`).set({
            title: session.metadata.title,
            sessionCode: sessionCode,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            isOwner: false
        });

        console.log(`✅ Joined session: ${session.metadata.title}`);

        return { sessionId, session };
    }

    /**
     * Add current user as participant
     */
    async joinAsParticipant(sessionId) {
        const tier = window.subscriptionManager ? window.subscriptionManager.getCurrentTier() : 'FREE';

        await this.database.ref(`sessions/${sessionId}/participants/${this.currentUser.uid}`).set({
            name: this.currentUser.displayName || this.currentUser.email,
            tier: tier,
            joinedAt: Date.now(),
            status: 'connected'
        });
    }

    /**
     * Join a session as singer (anonymous, lyrics only)
     * @param {string} sessionCode - 6-character code (e.g., "A3F-7K2")
     */
    async joinAsSinger(sessionCode) {
        // Find session by code
        const sessionsRef = this.database.ref('sessions');
        const snapshot = await sessionsRef.orderByChild('metadata/sessionCode').equalTo(sessionCode).once('value');

        if (!snapshot.exists()) {
            throw new Error('Session not found. Check the code and try again.');
        }

        const sessionData = snapshot.val();
        const sessionId = Object.keys(sessionData)[0];
        const session = sessionData[sessionId];

        if (session.metadata.status !== 'active') {
            throw new Error('This session has ended');
        }

        if (!session.metadata.allowSingers) {
            throw new Error('This session does not allow singers. Ask the leader to enable it.');
        }

        // Count existing singers to generate name
        const participants = session.participants || {};
        let singerCount = 0;
        for (const uid in participants) {
            if (participants[uid].type === 'singer') {
                singerCount++;
            }
        }
        const singerName = `Singer ${singerCount + 1}`;

        // Get current anonymous user
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Anonymous authentication required');
        }
        this.currentUser = user;

        // Start listening to session updates
        this.listenToSessionUpdates(sessionId);

        // Set as active session
        this.activeSession = sessionId;
        this.isLeader = false;
        this.isSinger = true;
        this.inLiveMode = true;

        // Add as singer participant
        await this.database.ref(`sessions/${sessionId}/participants/${user.uid}`).set({
            name: singerName,
            type: 'singer',
            joinedAt: Date.now(),
            status: 'connected'
        });

        console.log(`🎤 Joined session as ${singerName}`);

        return { sessionId, session, singerName };
    }

    /**
     * Toggle allow singers setting (LEADER only)
     * @param {boolean} allow - Whether to allow anonymous singers
     */
    async toggleAllowSingers(allow) {
        if (!this.isLeader || !this.activeSession) {
            throw new Error('Only the session leader can change singer settings');
        }

        await this.database.ref(`sessions/${this.activeSession}/metadata/allowSingers`).set(allow);
        console.log(`🎤 Singers ${allow ? 'enabled' : 'disabled'}`);

        return allow;
    }

    /**
     * Get whether singers are allowed in current session
     */
    async getAllowSingers() {
        if (!this.activeSession) return false;

        const snapshot = await this.database.ref(`sessions/${this.activeSession}/metadata/allowSingers`).once('value');
        return snapshot.val() || false;
    }

    /**
     * Listen to real-time session updates
     */
    listenToSessionUpdates(sessionId) {
        // Clean up existing listeners
        this.cleanup();

        // Listen to current song changes
        const songRef = this.database.ref(`sessions/${sessionId}/currentSong`);
        const songListener = songRef.on('value', (snapshot) => {
            const songData = snapshot.val();

            if (songData && !this.isLeader) {
                // Always cache the leader's current song
                this.leaderCurrentSong = songData;
                console.log('📻 Received song update from leader:', songData.name);
                // Always notify - let app.js decide whether to display based on inLiveMode
                this.onSongUpdate(songData, this.inLiveMode);
            }
        });

        this.listeners.push({ ref: songRef, type: 'value' });

        // Listen to playlist changes
        const playlistRef = this.database.ref(`sessions/${sessionId}/playlist`);
        const playlistListener = playlistRef.on('value', (snapshot) => {
            const playlist = snapshot.val();
            if (playlist) {
                this.onPlaylistUpdate(playlist);
            }
        });

        this.listeners.push({ ref: playlistRef, type: 'value' });

        // Listen to participant changes
        const participantsRef = this.database.ref(`sessions/${sessionId}/participants`);
        const participantsListener = participantsRef.on('value', (snapshot) => {
            const participants = snapshot.val();
            if (participants) {
                this.onParticipantsUpdate(participants);
            }
        });

        this.listeners.push({ ref: participantsRef, type: 'value' });

        // Listen to selected section changes
        const selectedSectionRef = this.database.ref(`sessions/${sessionId}/selectedSection`);
        const selectedSectionListener = selectedSectionRef.on('value', (snapshot) => {
            const selection = snapshot.val();
            if (selection) {
                this.onSectionSelected(selection.sectionId, selection.sectionName);
            }
        });

        this.listeners.push({ ref: selectedSectionRef, type: 'value' });
    }

    /**
     * Update current song (LEADER only)
     */
    async updateCurrentSong(songData) {
        if (!this.isLeader || !this.activeSession) {
            throw new Error('Only the session leader can update the current song');
        }

        const currentSongData = {
            songId: songData.id || `song_${Date.now()}`,

            // Legacy field
            name: songData.name,

            // ✅ NEW STRUCTURED METADATA FIELDS
            title: songData.title || songData.name || 'Untitled',
            author: songData.author || '',
            key: songData.key || songData.originalKey || 'Unknown',
            bpm: songData.bpm || null,
            timeSignature: songData.timeSignature || '',

            // Content
            content: songData.content,

            // Transpose state
            originalKey: songData.originalKey || 'Unknown',
            transposeSteps: songData.transposeSteps || 0,

            // Timestamp
            updatedAt: Date.now()
        };

        await this.database.ref(`sessions/${this.activeSession}/currentSong`).set(currentSongData);
        console.log(`📡 Broadcasting song: ${songData.name}`);
    }

    /**
     * Update selected section (LEADER only)
     * @param {string} sectionId - Section identifier
     * @param {string} sectionName - Section display name (e.g., "VERSE 1:", "CHORUS:")
     */
    async updateSelectedSection(sectionId, sectionName) {
        if (!this.isLeader || !this.activeSession) {
            throw new Error('Only the session leader can update the selected section');
        }

        const selectionData = {
            sectionId: sectionId,
            sectionName: sectionName,
            timestamp: Date.now()
        };

        await this.database.ref(`sessions/${this.activeSession}/selectedSection`).set(selectionData);
        console.log(`📍 Broadcasting selected section: ${sectionName}`);
    }

    /**
     * Add song to session playlist (LEADER only)
     */
    async addSongToPlaylist(songData) {
        if (!this.isLeader || !this.activeSession) {
            throw new Error('Only the session leader can add songs to the playlist');
        }

        const songId = songData.id || `song_${Date.now()}`;
        const playlistRef = this.database.ref(`sessions/${this.activeSession}/playlist/${songId}`);

        // Get current playlist to determine order
        const playlistSnapshot = await this.database.ref(`sessions/${this.activeSession}/playlist`).once('value');
        const playlist = playlistSnapshot.val() || {};
        const order = Object.keys(playlist).length;

        await playlistRef.set({
            // Legacy field
            name: songData.name,

            // ✅ NEW STRUCTURED METADATA FIELDS
            title: songData.title || songData.name || 'Untitled',
            author: songData.author || '',
            key: songData.key || songData.originalKey || 'Unknown',
            bpm: songData.bpm || null,
            timeSignature: songData.timeSignature || '',

            // Content
            content: songData.content || '',

            // Transpose state
            originalKey: songData.originalKey || 'Unknown',

            // Playlist metadata
            addedAt: Date.now(),
            order: order
        });

        console.log(`➕ Added to playlist: ${songData.name}`);
    }

    /**
     * Remove song from playlist (LEADER only)
     */
    async removeSongFromPlaylist(songId) {
        if (!this.isLeader || !this.activeSession) {
            throw new Error('Only the session leader can remove songs from the playlist');
        }

        await this.database.ref(`sessions/${this.activeSession}/playlist/${songId}`).remove();
        console.log(`➖ Removed from playlist: ${songId}`);
    }

    /**
     * Update a song in the active session's playlist
     * Called when user edits a song from their library
     */
    async updateSongInPlaylist(songId, updatedData) {
        if (!this.activeSession) return false;

        const playlistSongRef = this.database.ref(`sessions/${this.activeSession}/playlist/${songId}`);

        const snapshot = await playlistSongRef.once('value');
        if (snapshot.exists()) {
            // Song exists in playlist, update it
            await playlistSongRef.update({
                name: updatedData.title || updatedData.name,
                title: updatedData.title,
                author: updatedData.author,
                content: updatedData.content,
                key: updatedData.key || updatedData.originalKey,
                originalKey: updatedData.originalKey,
                bpm: updatedData.bpm,
                timeSignature: updatedData.timeSignature,
                baselineChart: updatedData.baselineChart,
                updatedAt: new Date().toISOString()
            });
            console.log(`🔄 Updated song ${songId} in playlist`);
            return true;
        }
        return false;
    }

    /**
     * Get session participants
     */
    async getParticipants() {
        if (!this.activeSession) return [];

        const snapshot = await this.database.ref(`sessions/${this.activeSession}/participants`).once('value');
        const participants = snapshot.val() || {};

        return Object.entries(participants).map(([uid, data]) => ({
            uid,
            ...data
        }));
    }

    /**
     * Get session playlist
     */
    async getPlaylist() {
        if (!this.activeSession) return [];

        const snapshot = await this.database.ref(`sessions/${this.activeSession}/playlist`).once('value');
        const playlist = snapshot.val() || {};

        return Object.entries(playlist)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Toggle live mode (PLAYER only)
     */
    toggleLiveMode() {
        if (this.isLeader) return; // Leaders are always in "live mode"

        this.inLiveMode = !this.inLiveMode;
        console.log(`${this.inLiveMode ? '📻 Entered' : '📴 Exited'} live mode`);

        return this.inLiveMode;
    }

    /**
     * Set local transpose for a specific song
     * @param {string} songId - Song identifier
     * @param {number} steps - Transpose steps
     */
    setLocalTranspose(songId, steps) {
        this.localTransposeMap[songId] = steps;
        console.log(`🎵 Set local transpose for ${songId}: ${steps} steps`);
    }

    /**
     * Get local transpose for a specific song
     * @param {string} songId - Song identifier
     * @returns {number} Transpose steps (0 if not set)
     */
    getLocalTranspose(songId) {
        return this.localTransposeMap[songId] || 0;
    }

    /**
     * Get the leader's current song (for "Return to Live" feature)
     * @returns {object|null} Current song data or null
     */
    getLeaderCurrentSong() {
        return this.leaderCurrentSong;
    }

    /**
     * Set live mode directly (for "Return to Live" feature)
     * @param {boolean} enabled - Whether to enable live mode
     */
    setLiveMode(enabled) {
        if (this.isLeader) return;
        this.inLiveMode = enabled;
        console.log(`${this.inLiveMode ? '📻 Entered' : '📴 Exited'} live mode`);
        return this.inLiveMode;
    }

    /**
     * Leave session
     */
    async leaveSession() {
        if (!this.activeSession || !this.currentUser) return;

        // Update participant status
        await this.database.ref(`sessions/${this.activeSession}/participants/${this.currentUser.uid}/status`).set('disconnected');

        // Clean up listeners
        this.cleanup();

        console.log('👋 Left session');
    }

    /**
     * End session (LEADER only)
     */
    async endSession() {
        if (!this.isLeader || !this.activeSession) {
            throw new Error('Only the session leader can end the session');
        }

        // Update session status
        await this.database.ref(`sessions/${this.activeSession}/metadata/status`).set('ended');

        // Disconnect all participants
        const participants = await this.getParticipants();
        for (const participant of participants) {
            await this.database.ref(`sessions/${this.activeSession}/participants/${participant.uid}/status`).set('disconnected');
        }

        console.log('🛑 Session ended');

        // Clean up
        this.cleanup();
    }

    /**
     * Get user's saved sessions
     */
    async getUserSessions() {
        if (!this.currentUser) return [];

        const snapshot = await this.database.ref(`users/${this.currentUser.uid}/sessions`).once('value');
        const sessions = snapshot.val() || {};

        return Object.entries(sessions)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.lastUsed - a.lastUsed);
    }

    /**
     * Reactivate a saved session (LEADER only)
     */
    async reactivateSession(sessionId) {
        if (!this.currentUser) {
            throw new Error('Must be logged in');
        }

        // Get session data
        const snapshot = await this.database.ref(`sessions/${sessionId}`).once('value');
        const session = snapshot.val();

        if (!session) {
            throw new Error('Session not found');
        }

        if (session.metadata.leaderId !== this.currentUser.uid) {
            throw new Error('Only the session owner can reactivate it');
        }

        // Update session status
        await this.database.ref(`sessions/${sessionId}/metadata/status`).set('active');

        // Set as active session
        this.activeSession = sessionId;
        this.isLeader = true;

        // Rejoin as participant
        await this.joinAsParticipant(sessionId);

        // Update last used
        await this.database.ref(`users/${this.currentUser.uid}/sessions/${sessionId}/lastUsed`).set(Date.now());

        console.log(`🔄 Reactivated session: ${session.metadata.title}`);

        return { sessionId, session };
    }

    /**
     * Clean up listeners
     */
    cleanup() {
        this.listeners.forEach(({ ref, type }) => {
            ref.off(type);
        });
        this.listeners = [];
        this.activeSession = null;
        this.isLeader = false;
        this.isSinger = false;
        this.inLiveMode = true;
        this.localTransposeMap = {};
        this.leaderCurrentSong = null;
    }

    /**
     * Callback when song is updated (override in implementation)
     * @param {object} songData - Song data from leader
     * @param {boolean} shouldDisplay - Whether to display the song (based on inLiveMode)
     */
    onSongUpdate(songData, shouldDisplay) {
        console.log('Song update received:', songData, 'shouldDisplay:', shouldDisplay);
        // Override this in app.js to update the UI
    }

    /**
     * Callback when playlist is updated (override in implementation)
     */
    onPlaylistUpdate(playlist) {
        console.log('Playlist update received');
        // Override this in app.js to update the UI
    }

    /**
     * Callback when participants change (override in implementation)
     */
    onParticipantsUpdate(participants) {
        console.log('Participants update received:', Object.keys(participants).length, 'participants');
        // Override this in app.js to update the UI
    }

    /**
     * Callback when section is selected (override in implementation)
     * @param {string} sectionId - Selected section identifier
     * @param {string} sectionName - Selected section name
     */
    onSectionSelected(sectionId, sectionName) {
        console.log('Section selected:', sectionName);
        // Override this in app.js/live-mode.js to update the UI
        // Highlight the selected section in Live Mode
        if (window.liveMode && window.liveMode.isActive) {
            window.liveMode.highlightSection(sectionId);
        }
    }
}

// Initialize and expose globally
const sessionManager = new SessionManager();
window.sessionManager = sessionManager;

console.log('✅ Session Manager initialized');
