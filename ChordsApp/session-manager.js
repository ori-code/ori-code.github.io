// ChordsApp Live Session Manager
// Handles real-time collaboration between leaders (PRO) and players (BASIC+)

class SessionManager {
    constructor() {
        this.currentUser = null;
        this.activeSession = null;
        this.isLeader = false;
        this.listeners = [];
        this.inLiveMode = true; // Players follow leader by default
        this.localTranspose = 0; // Player's local transpose
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
                status: 'active'
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

        // Set as active session
        this.activeSession = sessionId;
        this.isLeader = (session.metadata.leaderId === this.currentUser.uid);
        this.inLiveMode = true; // Start in live mode

        // Add as participant
        await this.joinAsParticipant(sessionId);

        // Start listening to session updates
        this.listenToSessionUpdates(sessionId);

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
     * Listen to real-time session updates
     */
    listenToSessionUpdates(sessionId) {
        // Clean up existing listeners
        this.cleanup();

        // Listen to current song changes
        const songRef = this.database.ref(`sessions/${sessionId}/currentSong`);
        const songListener = songRef.on('value', (snapshot) => {
            const songData = snapshot.val();

            if (songData && this.inLiveMode && !this.isLeader) {
                console.log('📻 Received song update from leader:', songData.name);
                this.onSongUpdate(songData);
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
            name: songData.name,
            content: songData.content,
            originalKey: songData.originalKey || 'Unknown',
            transposeSteps: songData.transposeSteps || 0,
            bpm: songData.bpm || null,
            updatedAt: Date.now()
        };

        await this.database.ref(`sessions/${this.activeSession}/currentSong`).set(currentSongData);
        console.log(`📡 Broadcasting song: ${songData.name}`);
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
            name: songData.name,
            originalKey: songData.originalKey || 'Unknown',
            bpm: songData.bpm || null,
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
        this.inLiveMode = true;
        this.localTranspose = 0;
    }

    /**
     * Callback when song is updated (override in implementation)
     */
    onSongUpdate(songData) {
        console.log('Song update received:', songData);
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
}

// Initialize and expose globally
const sessionManager = new SessionManager();
window.sessionManager = sessionManager;

console.log('✅ Session Manager initialized');
