/**
 * aChordim Pad Player
 * Plays looping ambient pad sounds for each musical key
 */

const padPlayer = {
    // Audio context
    audioContext: null,

    // Loaded audio buffers for each key
    buffers: {},

    // Currently playing sources
    activeSources: {},

    // Gain nodes for volume control
    gainNodes: {},

    // Master gain node
    masterGain: null,

    // Effect nodes
    lowPassFilter: null,
    highPassFilter: null,
    convolver: null,       // For reverb
    reverbGain: null,      // Wet/dry mix for reverb
    dryGain: null,         // Dry signal
    pannerNode: null,

    // Current settings
    volume: 0.7,
    crossfade: 4,          // Fade duration in seconds (longer for smooth transitions)
    lowPassFreq: 20000,    // Hz (20000 = no filtering)
    highPassFreq: 20,      // Hz (20 = no filtering)
    reverbMix: 0.3,        // 0-1 (0 = dry, 1 = full reverb) - default 30%
    pan: 0,                // -1 to 1 (left to right)

    // Fade duration in seconds (same as crossfade)
    fadeDuration: 4,

    // Stop All fade duration (longer for smooth ending)
    stopAllFadeDuration: 6,

    // All 12 keys
    keys: ['C', 'Csharp', 'D', 'Dsharp', 'E', 'F', 'Fsharp', 'G', 'Gsharp', 'A', 'Asharp', 'B'],

    // Display names for keys
    keyDisplayNames: {
        'C': 'C',
        'Csharp': 'C#',
        'D': 'D',
        'Dsharp': 'D#',
        'E': 'E',
        'F': 'F',
        'Fsharp': 'F#',
        'G': 'G',
        'Gsharp': 'G#',
        'A': 'A',
        'Asharp': 'A#',
        'B': 'B'
    },

    // Local pad sound files (served from same host)
    soundUrls: {
        'C': './pads/C.mp3',
        'Csharp': './pads/Csharp.mp3',
        'D': './pads/D.mp3',
        'Dsharp': './pads/Dsharp.mp3',
        'E': './pads/E.mp3',
        'F': './pads/F.mp3',
        'Fsharp': './pads/Fsharp.mp3',
        'G': './pads/G.mp3',
        'Gsharp': './pads/Gsharp.mp3',
        'A': './pads/A.mp3',
        'Asharp': './pads/Asharp.mp3',
        'B': './pads/B.mp3'
    },

    // Loading state
    isLoading: false,
    loadedCount: 0,

    // Preloaded raw audio data (before AudioContext is available)
    rawAudioCache: {},
    isPreloading: false,
    preloadedCount: 0,

    /**
     * Preload audio files as raw data (can be called without user interaction)
     * Files are fetched and cached, decoded later when AudioContext is available
     */
    async preloadFiles(onProgress = null) {
        if (this.isPreloading || Object.keys(this.rawAudioCache).length === this.keys.length) return;

        this.isPreloading = true;
        this.preloadedCount = 0;

        const loadPromises = this.keys.map(async (key) => {
            try {
                // Skip if already cached or already decoded
                if (this.rawAudioCache[key] || this.buffers[key]) {
                    this.preloadedCount++;
                    if (onProgress) onProgress(this.preloadedCount, this.keys.length);
                    return;
                }

                const url = this.soundUrls[key];
                if (!url) {
                    console.warn(`No URL configured for pad: ${key}`);
                    return;
                }
                const response = await fetch(url);

                if (!response.ok) {
                    console.warn(`Pad sound not found: ${url}`);
                    return;
                }

                // Store raw ArrayBuffer (no AudioContext needed)
                this.rawAudioCache[key] = await response.arrayBuffer();
                this.preloadedCount++;

                if (onProgress) {
                    onProgress(this.preloadedCount, this.keys.length);
                }

                console.log(`Preloaded pad: ${key}`);
            } catch (error) {
                console.error(`Error preloading pad ${key}:`, error);
            }
        });

        await Promise.all(loadPromises);

        this.isPreloading = false;
        console.log(`Preloaded ${this.preloadedCount}/${this.keys.length} pad files`);

        return this.preloadedCount;
    },

    /**
     * Initialize the pad player
     */
    async init() {
        // Create audio context on user interaction (required by browsers)
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create effect chain:
            // Source -> LowPass -> HighPass -> (Dry + Reverb) -> Panner -> MasterGain -> Destination

            // Low Pass Filter
            this.lowPassFilter = this.audioContext.createBiquadFilter();
            this.lowPassFilter.type = 'lowpass';
            this.lowPassFilter.frequency.value = this.lowPassFreq;
            this.lowPassFilter.Q.value = 0.7;

            // High Pass Filter
            this.highPassFilter = this.audioContext.createBiquadFilter();
            this.highPassFilter.type = 'highpass';
            this.highPassFilter.frequency.value = this.highPassFreq;
            this.highPassFilter.Q.value = 0.7;

            // Dry gain (for reverb mix)
            this.dryGain = this.audioContext.createGain();
            this.dryGain.gain.value = 1;

            // Reverb (convolver) with gain
            this.convolver = this.audioContext.createConvolver();
            this.reverbGain = this.audioContext.createGain();
            this.reverbGain.gain.value = this.reverbMix;

            // Create impulse response for reverb
            this.createReverbImpulse(2, 2);

            // Stereo Panner
            this.pannerNode = this.audioContext.createStereoPanner();
            this.pannerNode.pan.value = this.pan;

            // Master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;

            // Connect the chain:
            // Filters -> Dry/Wet split
            this.lowPassFilter.connect(this.highPassFilter);

            // Dry path
            this.highPassFilter.connect(this.dryGain);
            this.dryGain.connect(this.pannerNode);

            // Wet path (reverb)
            this.highPassFilter.connect(this.convolver);
            this.convolver.connect(this.reverbGain);
            this.reverbGain.connect(this.pannerNode);

            // Panner -> Master -> Output
            this.pannerNode.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
        }

        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        console.log('Pad Player initialized with effects');
    },

    /**
     * Create reverb impulse response
     */
    createReverbImpulse(duration, decay) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }

        this.convolver.buffer = impulse;
    },

    /**
     * Load all pad sounds (decodes preloaded files or fetches if not preloaded)
     */
    async loadSounds(onProgress = null) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.loadedCount = 0;

        await this.init();

        const loadPromises = this.keys.map(async (key) => {
            try {
                // Skip if already decoded
                if (this.buffers[key]) {
                    this.loadedCount++;
                    if (onProgress) onProgress(this.loadedCount, this.keys.length);
                    return;
                }

                let arrayBuffer;

                // Use preloaded cache if available (much faster)
                if (this.rawAudioCache[key]) {
                    arrayBuffer = this.rawAudioCache[key];
                    console.log(`Using preloaded cache for: ${key}`);
                } else {
                    // Fetch if not preloaded
                    const url = this.soundUrls[key];
                    if (!url) {
                        console.warn(`No URL configured for pad: ${key}`);
                        return;
                    }
                    const response = await fetch(url);

                    if (!response.ok) {
                        console.warn(`Pad sound not found: ${url}`);
                        return;
                    }

                    arrayBuffer = await response.arrayBuffer();
                }

                // Decode audio (requires AudioContext)
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

                this.buffers[key] = audioBuffer;
                delete this.rawAudioCache[key]; // Free memory
                this.loadedCount++;

                if (onProgress) {
                    onProgress(this.loadedCount, this.keys.length);
                }

                console.log(`Decoded pad: ${key}`);
            } catch (error) {
                console.error(`Error loading pad ${key}:`, error);
            }
        });

        await Promise.all(loadPromises);

        this.isLoading = false;
        console.log(`Loaded ${this.loadedCount}/${this.keys.length} pad sounds`);

        return this.loadedCount;
    },

    /**
     * Check if a key is currently playing
     */
    isPlaying(key) {
        return !!this.activeSources[key];
    },

    /**
     * Toggle a pad on/off
     */
    toggle(key) {
        if (this.isPlaying(key)) {
            this.stop(key);
        } else {
            this.play(key);
        }
    },

    /**
     * Play a pad sound (looped) - crossfades from any currently playing pad
     */
    async play(key) {
        await this.init();

        if (!this.buffers[key]) {
            console.warn(`Pad not loaded: ${key}`);
            return false;
        }

        // Crossfade: Stop all other playing pads (fade out)
        const currentlyPlaying = Object.keys(this.activeSources);
        currentlyPlaying.forEach(playingKey => {
            if (playingKey !== key) {
                this.stop(playingKey);
            }
        });

        // If this key is already playing, just return (toggle will handle stopping it)
        if (this.activeSources[key]) {
            return true;
        }

        // Create source node
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers[key];
        source.loop = true;

        // Create gain node for this source (for fade in/out)
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

        // Connect: source -> gain -> effect chain (lowPass -> highPass -> reverb -> pan -> master)
        source.connect(gainNode);
        gainNode.connect(this.lowPassFilter);

        // Store references
        this.activeSources[key] = source;
        this.gainNodes[key] = gainNode;

        // Start playing
        source.start(0);

        // Fade in
        gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.fadeDuration);

        // Update UI
        this.updateKeyUI(key, true);

        console.log(`Playing pad: ${key}`);
        return true;
    },

    /**
     * Stop a pad sound
     */
    stop(key) {
        if (!this.activeSources[key]) return;

        const source = this.activeSources[key];
        const gainNode = this.gainNodes[key];

        // Fade out smoothly - must set current value first for smooth ramp
        const currentTime = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + this.fadeDuration);

        // Stop after fade out
        setTimeout(() => {
            try {
                source.stop();
            } catch (e) {
                // Source may already be stopped
            }
        }, this.fadeDuration * 1000);

        // Remove references
        delete this.activeSources[key];
        delete this.gainNodes[key];

        // Update UI
        this.updateKeyUI(key, false);

        console.log(`Stopped pad: ${key}`);
    },

    /**
     * Stop all playing pads with a slow fade out
     */
    stopAll() {
        Object.keys(this.activeSources).forEach(key => {
            this.stopWithFade(key, this.stopAllFadeDuration);
        });
    },

    /**
     * Stop a pad with a specific fade duration
     */
    stopWithFade(key, fadeTime) {
        if (!this.activeSources[key]) return;

        const source = this.activeSources[key];
        const gainNode = this.gainNodes[key];

        // Fade out with specified duration
        const currentTime = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeTime);

        // Stop after fade out
        setTimeout(() => {
            try {
                source.stop();
            } catch (e) {
                // Source may already be stopped
            }
        }, fadeTime * 1000);

        // Remove references
        delete this.activeSources[key];
        delete this.gainNodes[key];

        // Update UI
        this.updateKeyUI(key, false);

        console.log(`Stopped pad: ${key} (fade: ${fadeTime}s)`);
    },

    /**
     * Set master volume
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                this.volume,
                this.audioContext.currentTime + 0.1
            );
        }
    },

    /**
     * Set crossfade duration (seconds)
     * Minimum 2.5 seconds for smooth transitions
     */
    setCrossfade(value) {
        this.crossfade = Math.max(2.5, Math.min(8, value));
        this.fadeDuration = this.crossfade;
    },

    /**
     * Set low pass filter frequency
     * value: 0-1 (0 = 200Hz, 1 = 20000Hz)
     */
    setLowPass(value) {
        // Map 0-1 to logarithmic frequency scale (200Hz to 20000Hz)
        const minFreq = 200;
        const maxFreq = 20000;
        this.lowPassFreq = minFreq * Math.pow(maxFreq / minFreq, value);

        if (this.lowPassFilter) {
            this.lowPassFilter.frequency.linearRampToValueAtTime(
                this.lowPassFreq,
                this.audioContext.currentTime + 0.1
            );
        }
    },

    /**
     * Set high pass filter frequency
     * value: 0-1 (0 = 20Hz, 1 = 2000Hz)
     */
    setHighPass(value) {
        // Map 0-1 to logarithmic frequency scale (20Hz to 2000Hz)
        const minFreq = 20;
        const maxFreq = 2000;
        this.highPassFreq = minFreq * Math.pow(maxFreq / minFreq, value);

        if (this.highPassFilter) {
            this.highPassFilter.frequency.linearRampToValueAtTime(
                this.highPassFreq,
                this.audioContext.currentTime + 0.1
            );
        }
    },

    /**
     * Set reverb mix (0 = dry, 1 = full reverb)
     */
    setReverb(value) {
        this.reverbMix = Math.max(0, Math.min(1, value));

        if (this.reverbGain && this.dryGain) {
            // Crossfade between dry and wet
            this.reverbGain.gain.linearRampToValueAtTime(
                this.reverbMix,
                this.audioContext.currentTime + 0.1
            );
            // Keep dry signal but reduce slightly when reverb is high
            this.dryGain.gain.linearRampToValueAtTime(
                1 - (this.reverbMix * 0.3),
                this.audioContext.currentTime + 0.1
            );
        }
    },

    /**
     * Set pan (-1 = left, 0 = center, 1 = right)
     */
    setPan(value) {
        this.pan = Math.max(-1, Math.min(1, value));

        if (this.pannerNode) {
            this.pannerNode.pan.linearRampToValueAtTime(
                this.pan,
                this.audioContext.currentTime + 0.1
            );
        }
    },

    /**
     * Update UI for a key (both modal and mini player)
     */
    updateKeyUI(key, isPlaying) {
        // Update modal button
        const keyBtn = document.getElementById(`pad-key-${key}`);
        if (keyBtn) {
            if (isPlaying) {
                keyBtn.classList.add('playing');
            } else {
                keyBtn.classList.remove('playing');
            }
        }

        // Update mini player button in side menu
        const miniBtn = document.querySelector(`.mini-pad-key[data-key="${key}"]`);
        if (miniBtn) {
            if (isPlaying) {
                miniBtn.classList.add('playing');
            } else {
                miniBtn.classList.remove('playing');
            }
        }

        // Update "Now Playing" indicators
        this.updateNowPlaying();
    },

    /**
     * Update the "Now Playing" display (both modal and mini player)
     */
    updateNowPlaying() {
        const playingKeys = this.getPlayingKeys();
        const displayNames = playingKeys.map(k => this.keyDisplayNames[k] || k);
        const displayText = displayNames.join(', ');

        // Modal "Now Playing"
        const nowPlayingDiv = document.getElementById('padsNowPlaying');
        const nowPlayingKey = document.getElementById('padsNowPlayingKey');
        if (nowPlayingDiv && nowPlayingKey) {
            if (playingKeys.length === 0) {
                nowPlayingDiv.style.display = 'none';
            } else {
                nowPlayingDiv.style.display = 'block';
                nowPlayingKey.textContent = displayText;
            }
        }

        // Mini player "Now Playing" in side menu
        const miniNowPlaying = document.getElementById('miniPadNowPlaying');
        if (miniNowPlaying) {
            miniNowPlaying.textContent = displayText;
        }

        // Mini player stop button - show active when pads are playing
        const miniStopBtn = document.getElementById('miniPadStop');
        if (miniStopBtn) {
            miniStopBtn.classList.toggle('active', playingKeys.length > 0);
        }
    },

    /**
     * Get currently playing keys
     */
    getPlayingKeys() {
        return Object.keys(this.activeSources);
    }
};

// Expose globally
window.padPlayer = padPlayer;

console.log('Pad Player module loaded');
