// ChordsApp MIDI Controller - Hands-free control for Live Mode
// Allows foot pedals and MIDI controllers to scroll charts and navigate songs

const midiController = {
    enabled: false,
    midiAccess: null,
    learningAction: null, // Currently learning this action
    lastMidiTime: 0,
    DEBOUNCE_MS: 200, // Prevent rapid triggers

    // Default CC mappings (can be customized by user)
    mappingConfig: {
        scrollDown: 30,  // CC#30
        scrollUp: 31,    // CC#31
        nextSong: 32,    // CC#32
        prevSong: 33     // CC#33
    },

    // Action handlers (set by live-mode.js)
    actions: {
        scrollDown: null,
        scrollUp: null,
        nextSong: null,
        prevSong: null
    },

    /**
     * Initialize MIDI access
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        if (!navigator.requestMIDIAccess) {
            console.log('Web MIDI API not supported in this browser');
            this.updateStatus('MIDI not supported');
            return false;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.setupListeners();
            this.enabled = true;

            // Listen for device connect/disconnect
            this.midiAccess.onstatechange = (e) => this.onStateChange(e);

            const deviceCount = this.midiAccess.inputs.size;
            if (deviceCount > 0) {
                this.updateStatus(`MIDI: ${deviceCount} device(s)`);
                console.log(`MIDI initialized: ${deviceCount} device(s) found`);
            } else {
                this.updateStatus('No MIDI devices');
                console.log('MIDI initialized but no devices connected');
            }

            return true;
        } catch (err) {
            console.error('MIDI access denied:', err);
            this.updateStatus('MIDI access denied');
            return false;
        }
    },

    /**
     * Set up MIDI message listeners on all inputs
     */
    setupListeners() {
        this.midiAccess.inputs.forEach((input, key) => {
            console.log(`Listening to MIDI input: ${input.name}`);
            input.onmidimessage = (event) => this.handleMessage(event);
        });
    },

    /**
     * Handle device connect/disconnect
     */
    onStateChange(event) {
        const port = event.port;
        console.log(`MIDI ${port.type} ${port.name} ${port.state}`);

        if (port.type === 'input') {
            if (port.state === 'connected') {
                port.onmidimessage = (event) => this.handleMessage(event);
                this.updateStatus(`MIDI: ${port.name}`);
            }

            // Update device count
            const deviceCount = this.midiAccess.inputs.size;
            if (deviceCount === 0) {
                this.updateStatus('No MIDI devices');
            }
        }
    },

    /**
     * Handle incoming MIDI messages
     */
    handleMessage(event) {
        const [status, data1, data2] = event.data;
        const messageType = status & 0xF0;
        const channel = status & 0x0F;

        // Debounce - prevent rapid triggers
        if (event.timeStamp - this.lastMidiTime < this.DEBOUNCE_MS) {
            return;
        }

        // Control Change (CC) - best for foot pedals and knobs
        if (messageType === 0xB0) {
            const ccNumber = data1;
            const value = data2;

            console.log(`MIDI CC#${ccNumber} = ${value} (ch ${channel + 1})`);

            // If in learn mode, capture this CC
            if (this.learningAction && value > 0) {
                this.setMapping(this.learningAction, ccNumber);
                this.learningAction = null;
                return;
            }

            // Trigger action if value > 0 (pedal pressed / button on)
            if (value > 0) {
                this.triggerAction(ccNumber);
                this.lastMidiTime = event.timeStamp;
            }
        }

        // Note On - can also be used for triggers
        if (messageType === 0x90 && data2 > 0) {
            const note = data1;
            const velocity = data2;

            console.log(`MIDI Note ${note} velocity ${velocity}`);

            // If in learn mode, capture this note
            if (this.learningAction) {
                // Store note as negative to distinguish from CC
                this.setMapping(this.learningAction, -note);
                this.learningAction = null;
                return;
            }

            // Check if any action is mapped to this note
            this.triggerNoteAction(note);
            this.lastMidiTime = event.timeStamp;
        }
    },

    /**
     * Trigger action by CC number
     */
    triggerAction(ccNumber) {
        for (const [action, cc] of Object.entries(this.mappingConfig)) {
            if (cc === ccNumber && this.actions[action]) {
                console.log(`MIDI triggering: ${action}`);
                this.actions[action]();
                return;
            }
        }
    },

    /**
     * Trigger action by note number
     */
    triggerNoteAction(noteNumber) {
        for (const [action, mapping] of Object.entries(this.mappingConfig)) {
            // Negative values are notes
            if (mapping === -noteNumber && this.actions[action]) {
                console.log(`MIDI note triggering: ${action}`);
                this.actions[action]();
                return;
            }
        }
    },

    /**
     * Start learning mode for an action
     */
    learn(action) {
        this.learningAction = action;
        this.updateStatus(`Press pedal for: ${this.getActionLabel(action)}`);

        // Update UI to show learning state
        const mappingEl = document.getElementById(`midiMapping-${action}`);
        if (mappingEl) {
            mappingEl.textContent = 'Waiting...';
            mappingEl.style.color = '#fbbf24'; // Yellow
        }
    },

    /**
     * Cancel learning mode
     */
    cancelLearn() {
        if (this.learningAction) {
            this.updateMappingDisplay(this.learningAction);
            this.learningAction = null;
            this.updateStatus('Learning cancelled');
        }
    },

    /**
     * Set a mapping and update display
     */
    setMapping(action, value) {
        this.mappingConfig[action] = value;
        this.updateMappingDisplay(action);
        this.updateStatus(`${this.getActionLabel(action)} mapped!`);
    },

    /**
     * Update the mapping display for an action
     */
    updateMappingDisplay(action) {
        const mappingEl = document.getElementById(`midiMapping-${action}`);
        if (mappingEl) {
            const value = this.mappingConfig[action];
            if (value < 0) {
                mappingEl.textContent = `Note ${-value}`;
            } else {
                mappingEl.textContent = `CC#${value}`;
            }
            mappingEl.style.color = '#4ade80'; // Green
        }
    },

    /**
     * Get human-readable label for action
     */
    getActionLabel(action) {
        const labels = {
            scrollDown: 'Scroll Down',
            scrollUp: 'Scroll Up',
            nextSong: 'Next Song',
            prevSong: 'Previous Song'
        };
        return labels[action] || action;
    },

    /**
     * Update status display
     */
    updateStatus(message) {
        const statusEl = document.getElementById('midiStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.display = 'inline';
        }

        const deviceStatusEl = document.getElementById('midiDeviceStatus');
        if (deviceStatusEl) {
            deviceStatusEl.textContent = message;
        }
    },

    /**
     * Save mappings to Firebase
     */
    async saveMappings() {
        const user = window.auth?.currentUser;
        if (!user) {
            console.log('User not logged in, saving to localStorage');
            localStorage.setItem('midiMappings', JSON.stringify(this.mappingConfig));
            return;
        }

        try {
            await firebase.database()
                .ref(`users/${user.uid}/midiMappings`)
                .set(this.mappingConfig);
            console.log('MIDI mappings saved to Firebase');
            this.updateStatus('Mappings saved!');
        } catch (error) {
            console.error('Error saving MIDI mappings:', error);
            // Fallback to localStorage
            localStorage.setItem('midiMappings', JSON.stringify(this.mappingConfig));
        }
    },

    /**
     * Load mappings from Firebase or localStorage
     */
    async loadMappings() {
        const user = window.auth?.currentUser;

        if (user) {
            try {
                const snapshot = await firebase.database()
                    .ref(`users/${user.uid}/midiMappings`)
                    .once('value');
                const savedMappings = snapshot.val();

                if (savedMappings) {
                    this.mappingConfig = { ...this.mappingConfig, ...savedMappings };
                    console.log('MIDI mappings loaded from Firebase:', this.mappingConfig);
                    this.refreshMappingDisplays();
                    return;
                }
            } catch (error) {
                console.error('Error loading MIDI mappings:', error);
            }
        }

        // Fallback to localStorage
        const localMappings = localStorage.getItem('midiMappings');
        if (localMappings) {
            try {
                this.mappingConfig = { ...this.mappingConfig, ...JSON.parse(localMappings) };
                console.log('MIDI mappings loaded from localStorage:', this.mappingConfig);
                this.refreshMappingDisplays();
            } catch (e) {
                console.error('Error parsing localStorage MIDI mappings:', e);
            }
        }
    },

    /**
     * Refresh all mapping displays
     */
    refreshMappingDisplays() {
        for (const action of Object.keys(this.mappingConfig)) {
            this.updateMappingDisplay(action);
        }
    },

    /**
     * Get list of connected devices
     */
    getDevices() {
        if (!this.midiAccess) return [];

        const devices = [];
        this.midiAccess.inputs.forEach((input) => {
            devices.push({
                id: input.id,
                name: input.name,
                manufacturer: input.manufacturer,
                state: input.state
            });
        });
        return devices;
    },

    /**
     * Check if MIDI is supported
     */
    isSupported() {
        return !!navigator.requestMIDIAccess;
    }
};

// Expose globally
window.midiController = midiController;

console.log('MIDI Controller module loaded');
