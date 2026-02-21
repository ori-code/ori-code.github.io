/**
 * aChordim Pad Player — Synthesizer Edition
 * Generates ambient pad sounds using Web Audio API oscillators
 * No audio files needed — works instantly on all devices including iOS
 */

const padPlayer = {
    // Audio context
    audioContext: null,

    // Buffers sentinel (checked by UI: Object.keys(padPlayer.buffers).length === 0)
    buffers: {},

    // Currently playing sources (each key maps to an object with oscillators + nodes)
    activeSources: {},

    // Gain nodes for volume control (per-key)
    gainNodes: {},

    // Master gain node
    masterGain: null,

    // Effect nodes
    lowPassFilter: null,
    highPassFilter: null,
    convolver: null,
    reverbGain: null,
    dryGain: null,
    pannerNode: null,

    // Filter LFO (global timbral movement)
    filterLFO: null,
    filterLFOGain: null,

    // Current settings
    volume: 0.7,
    crossfade: 4,
    lowPassFreq: 20000,
    highPassFreq: 20,
    reverbMix: 0.3,
    pan: 0,

    // Fade duration in seconds
    fadeDuration: 4,

    // Stop All fade duration
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

    // Base frequencies for each key (octave 2-3 range for warm ambient sound)
    keyFrequencies: {
        'C': 130.81,
        'Csharp': 138.59,
        'D': 146.83,
        'Dsharp': 155.56,
        'E': 164.81,
        'F': 174.61,
        'Fsharp': 185.00,
        'G': 196.00,
        'Gsharp': 207.65,
        'A': 110.00,
        'Asharp': 116.54,
        'B': 123.47
    },

    // Loading state (kept for UI compatibility)
    isLoading: false,
    loadedCount: 0,

    /**
     * Preload — no-op in synth mode (nothing to download)
     */
    async preloadFiles(onProgress = null) {
        if (onProgress) onProgress(this.keys.length, this.keys.length);
        return this.keys.length;
    },

    /**
     * Initialize the audio context and effect chain
     */
    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

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

            // Dry gain
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

            // Connect the effect chain:
            // Source -> per-key gain -> lowPass -> highPass -> dry/wet split -> panner -> master -> destination
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

            // Filter LFO for subtle timbral movement
            this.filterLFO = this.audioContext.createOscillator();
            this.filterLFO.type = 'sine';
            this.filterLFO.frequency.value = 0.08;
            this.filterLFOGain = this.audioContext.createGain();
            this.filterLFOGain.gain.value = 300;
            this.filterLFO.connect(this.filterLFOGain);
            this.filterLFOGain.connect(this.lowPassFilter.frequency);
            this.filterLFO.start();
        }

        // Resume context if suspended (required on iOS)
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
     * Load sounds — instant in synth mode, just initializes and marks ready
     */
    async loadSounds(onProgress = null) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.loadedCount = 0;

        await this.init();

        // Populate buffers sentinel so UI checks pass
        this.keys.forEach(key => {
            this.buffers[key] = true;
            this.loadedCount++;
            if (onProgress) onProgress(this.loadedCount, this.keys.length);
        });

        this.isLoading = false;
        console.log('Pad Player: synth ready (no files needed)');

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
     * Play a synth pad for the given key
     */
    async play(key) {
        await this.init();

        // Mark as ready if not done yet
        if (!this.buffers[key]) {
            this.buffers[key] = true;
        }

        const freq = this.keyFrequencies[key];
        if (!freq) {
            console.warn(`Unknown pad key: ${key}`);
            return false;
        }

        // Crossfade: stop other playing pads
        const currentlyPlaying = Object.keys(this.activeSources);
        currentlyPlaying.forEach(playingKey => {
            if (playingKey !== key) {
                this.stop(playingKey);
            }
        });

        // If already playing this key, just return
        if (this.activeSources[key]) {
            return true;
        }

        // Per-key gain node (for fade in/out)
        const keyGain = this.audioContext.createGain();
        keyGain.gain.value = 0;
        keyGain.connect(this.lowPassFilter);

        // Create 6 oscillators for a rich, warm pad sound
        const oscConfigs = [
            { type: 'sine',     freq: freq,       gain: 0.35, detune: 0 },    // Root fundamental
            { type: 'triangle', freq: freq,       gain: 0.15, detune: 0 },    // Harmonic warmth
            { type: 'sine',     freq: freq,       gain: 0.12, detune: +7 },   // Chorus L
            { type: 'sine',     freq: freq,       gain: 0.12, detune: -7 },   // Chorus R
            { type: 'sine',     freq: freq * 2,   gain: 0.08, detune: 0 },    // Octave brightness
            { type: 'sine',     freq: freq / 2,   gain: 0.18, detune: 0 },    // Sub warmth
        ];

        const oscillators = [];

        oscConfigs.forEach(cfg => {
            const osc = this.audioContext.createOscillator();
            osc.type = cfg.type;
            osc.frequency.value = cfg.freq;
            osc.detune.value = cfg.detune;

            const oscGain = this.audioContext.createGain();
            oscGain.gain.value = cfg.gain;

            osc.connect(oscGain);
            oscGain.connect(keyGain);
            osc.start();

            oscillators.push({ osc, gain: oscGain });
        });

        // Amplitude LFO for slow breathing effect
        const lfoOsc = this.audioContext.createOscillator();
        lfoOsc.type = 'sine';
        lfoOsc.frequency.value = 0.15;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 0.05;
        lfoOsc.connect(lfoGain);
        lfoGain.connect(keyGain.gain);
        lfoOsc.start();

        // Store references
        this.activeSources[key] = {
            oscillators,
            keyGain,
            lfoOsc,
            lfoGain
        };
        this.gainNodes[key] = keyGain;

        // Fade in
        keyGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.fadeDuration);

        // Update UI
        this.updateKeyUI(key, true);

        console.log(`Playing synth pad: ${key} (${freq} Hz)`);
        return true;
    },

    /**
     * Stop a pad sound
     */
    stop(key) {
        if (!this.activeSources[key]) return;

        const source = this.activeSources[key];
        const keyGain = this.gainNodes[key];

        // Fade out smoothly
        const currentTime = this.audioContext.currentTime;
        keyGain.gain.setValueAtTime(keyGain.gain.value, currentTime);
        keyGain.gain.linearRampToValueAtTime(0, currentTime + this.fadeDuration);

        // Stop all oscillators after fade out
        setTimeout(() => {
            try {
                source.oscillators.forEach(({ osc }) => osc.stop());
                source.lfoOsc.stop();
            } catch (e) {
                // May already be stopped
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
        const keyGain = this.gainNodes[key];

        // Fade out with specified duration
        const currentTime = this.audioContext.currentTime;
        keyGain.gain.setValueAtTime(keyGain.gain.value, currentTime);
        keyGain.gain.linearRampToValueAtTime(0, currentTime + fadeTime);

        // Stop after fade out
        setTimeout(() => {
            try {
                source.oscillators.forEach(({ osc }) => osc.stop());
                source.lfoOsc.stop();
            } catch (e) {
                // May already be stopped
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
     */
    setCrossfade(value) {
        this.crossfade = Math.max(2.5, Math.min(8, value));
        this.fadeDuration = this.crossfade;
    },

    /**
     * Set low pass filter frequency
     */
    setLowPass(value) {
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
     */
    setHighPass(value) {
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
            this.reverbGain.gain.linearRampToValueAtTime(
                this.reverbMix,
                this.audioContext.currentTime + 0.1
            );
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
        const keyBtn = document.getElementById(`pad-key-${key}`);
        if (keyBtn) {
            if (isPlaying) {
                keyBtn.classList.add('playing');
            } else {
                keyBtn.classList.remove('playing');
            }
        }

        const miniBtn = document.querySelector(`.mini-pad-key[data-key="${key}"]`);
        if (miniBtn) {
            if (isPlaying) {
                miniBtn.classList.add('playing');
            } else {
                miniBtn.classList.remove('playing');
            }
        }

        this.updateNowPlaying();
    },

    /**
     * Update the "Now Playing" display
     */
    updateNowPlaying() {
        const playingKeys = this.getPlayingKeys();
        const displayNames = playingKeys.map(k => this.keyDisplayNames[k] || k);
        const displayText = displayNames.join(', ');

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

        const miniNowPlaying = document.getElementById('miniPadNowPlaying');
        if (miniNowPlaying) {
            miniNowPlaying.textContent = displayText;
        }

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

console.log('Pad Player module loaded (synth mode)');
