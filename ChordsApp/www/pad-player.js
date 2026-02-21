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

    // Extended synth parameters
    oscLevels: {
        rootSine: 0.35,
        rootTriangle: 0.15,
        chorusL: 0.12,
        chorusR: 0.12,
        octaveUp: 0.08,
        sub: 0.18
    },
    chorusDetune: 7,         // cents
    octaveShift: 0,          // -1, 0, +1 octave shift for base frequency
    ampLfoRate: 0.15,        // Hz
    ampLfoDepth: 0.05,       // 0-0.3
    filterLfoRate: 0.08,     // Hz
    filterLfoDepth: 300,     // Hz range
    attackTime: 4,           // seconds (same as fadeDuration)
    releaseTime: 4,          // seconds (same as fadeDuration for stop)
    reverbDuration: 2,       // seconds
    reverbDecay: 2,          // decay factor

    // Presets
    presets: {
        default: { oscLevels: { rootSine: 0.35, rootTriangle: 0.15, chorusL: 0.12, chorusR: 0.12, octaveUp: 0.08, sub: 0.18 }, chorusDetune: 7, octaveShift: 0, ampLfoRate: 0.15, ampLfoDepth: 0.05, filterLfoRate: 0.08, filterLfoDepth: 300, attackTime: 4, releaseTime: 4, reverbDuration: 2, reverbDecay: 2, reverbMix: 0.3, lowPassFreq: 20000, highPassFreq: 20, volume: 0.7 },
        warm: { oscLevels: { rootSine: 0.40, rootTriangle: 0.20, chorusL: 0.10, chorusR: 0.10, octaveUp: 0.02, sub: 0.25 }, chorusDetune: 5, octaveShift: -1, ampLfoRate: 0.10, ampLfoDepth: 0.06, filterLfoRate: 0.05, filterLfoDepth: 200, attackTime: 5, releaseTime: 6, reverbDuration: 3, reverbDecay: 2.5, reverbMix: 0.4, lowPassFreq: 8000, highPassFreq: 20, volume: 0.7 },
        bright: { oscLevels: { rootSine: 0.25, rootTriangle: 0.20, chorusL: 0.15, chorusR: 0.15, octaveUp: 0.18, sub: 0.08 }, chorusDetune: 10, octaveShift: 1, ampLfoRate: 0.20, ampLfoDepth: 0.04, filterLfoRate: 0.10, filterLfoDepth: 500, attackTime: 3, releaseTime: 3, reverbDuration: 2, reverbDecay: 1.5, reverbMix: 0.25, lowPassFreq: 20000, highPassFreq: 80, volume: 0.65 },
        deep: { oscLevels: { rootSine: 0.30, rootTriangle: 0.10, chorusL: 0.08, chorusR: 0.08, octaveUp: 0.0, sub: 0.35 }, chorusDetune: 4, octaveShift: -1, ampLfoRate: 0.08, ampLfoDepth: 0.07, filterLfoRate: 0.04, filterLfoDepth: 150, attackTime: 6, releaseTime: 8, reverbDuration: 4, reverbDecay: 3, reverbMix: 0.5, lowPassFreq: 4000, highPassFreq: 20, volume: 0.75 },
        ethereal: { oscLevels: { rootSine: 0.20, rootTriangle: 0.10, chorusL: 0.18, chorusR: 0.18, octaveUp: 0.15, sub: 0.10 }, chorusDetune: 15, octaveShift: 1, ampLfoRate: 0.12, ampLfoDepth: 0.08, filterLfoRate: 0.06, filterLfoDepth: 600, attackTime: 5, releaseTime: 7, reverbDuration: 4, reverbDecay: 2, reverbMix: 0.6, lowPassFreq: 16000, highPassFreq: 60, volume: 0.6 },
        organ: { oscLevels: { rootSine: 0.30, rootTriangle: 0.25, chorusL: 0.05, chorusR: 0.05, octaveUp: 0.20, sub: 0.20 }, chorusDetune: 3, octaveShift: 0, ampLfoRate: 0.0, ampLfoDepth: 0.0, filterLfoRate: 0.0, filterLfoDepth: 0, attackTime: 0.5, releaseTime: 1, reverbDuration: 3, reverbDecay: 2, reverbMix: 0.35, lowPassFreq: 12000, highPassFreq: 40, volume: 0.7 },
    },

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
    async toggle(key) {
        if (this.isPlaying(key)) {
            this.stop(key);
        } else {
            await this.play(key);
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
        keyGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        keyGain.connect(this.lowPassFilter);

        // Apply octave shift to base frequency
        const shiftedFreq = freq * Math.pow(2, this.octaveShift);
        const lv = this.oscLevels;
        const dt = this.chorusDetune;

        // Create 6 oscillators with configurable levels
        const oscConfigs = [
            { type: 'sine',     freq: shiftedFreq,       gain: lv.rootSine,     detune: 0 },
            { type: 'triangle', freq: shiftedFreq,       gain: lv.rootTriangle, detune: 0 },
            { type: 'sine',     freq: shiftedFreq,       gain: lv.chorusL,      detune: +dt },
            { type: 'sine',     freq: shiftedFreq,       gain: lv.chorusR,      detune: -dt },
            { type: 'sine',     freq: shiftedFreq * 2,   gain: lv.octaveUp,     detune: 0 },
            { type: 'sine',     freq: shiftedFreq / 2,   gain: lv.sub,          detune: 0 },
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
        lfoOsc.frequency.value = this.ampLfoRate;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = this.ampLfoDepth;
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

        // Fade in using attack time
        keyGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.attackTime);

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

        // Fade out using release time
        const currentTime = this.audioContext.currentTime;
        keyGain.gain.setValueAtTime(keyGain.gain.value, currentTime);
        keyGain.gain.linearRampToValueAtTime(0, currentTime + this.releaseTime);

        // Stop all oscillators after fade out
        setTimeout(() => {
            try {
                source.oscillators.forEach(({ osc }) => osc.stop());
                source.lfoOsc.stop();
            } catch (e) {
                // May already be stopped
            }
        }, this.releaseTime * 1000);

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

    // === Extended Synth Controls ===

    /**
     * Set individual oscillator level (0-1)
     */
    setOscLevel(oscName, value) {
        this.oscLevels[oscName] = Math.max(0, Math.min(1, value));
        // Update live oscillators
        const oscIndex = { rootSine: 0, rootTriangle: 1, chorusL: 2, chorusR: 3, octaveUp: 4, sub: 5 };
        const idx = oscIndex[oscName];
        if (idx !== undefined) {
            Object.values(this.activeSources).forEach(source => {
                if (source.oscillators[idx]) {
                    source.oscillators[idx].gain.gain.linearRampToValueAtTime(
                        this.oscLevels[oscName],
                        this.audioContext.currentTime + 0.1
                    );
                }
            });
        }
    },

    /**
     * Set chorus detune width in cents (0-30)
     */
    setChorusDetune(cents) {
        this.chorusDetune = Math.max(0, Math.min(30, cents));
        // Update live chorus oscillators (index 2 = +detune, 3 = -detune)
        Object.values(this.activeSources).forEach(source => {
            if (source.oscillators[2]) source.oscillators[2].osc.detune.value = this.chorusDetune;
            if (source.oscillators[3]) source.oscillators[3].osc.detune.value = -this.chorusDetune;
        });
    },

    /**
     * Set octave shift (-1, 0, +1)
     */
    setOctaveShift(shift) {
        this.octaveShift = Math.max(-1, Math.min(1, Math.round(shift)));
        // Requires restart of playing pads to take effect
    },

    /**
     * Set amplitude LFO rate (0-2 Hz)
     */
    setAmpLfoRate(rate) {
        this.ampLfoRate = Math.max(0, Math.min(2, rate));
        Object.values(this.activeSources).forEach(source => {
            if (source.lfoOsc) source.lfoOsc.frequency.value = this.ampLfoRate;
        });
    },

    /**
     * Set amplitude LFO depth (0-0.3)
     */
    setAmpLfoDepth(depth) {
        this.ampLfoDepth = Math.max(0, Math.min(0.3, depth));
        Object.values(this.activeSources).forEach(source => {
            if (source.lfoGain) source.lfoGain.gain.value = this.ampLfoDepth;
        });
    },

    /**
     * Set filter LFO rate (0-1 Hz)
     */
    setFilterLfoRate(rate) {
        this.filterLfoRate = Math.max(0, Math.min(1, rate));
        if (this.filterLFO) this.filterLFO.frequency.value = this.filterLfoRate;
    },

    /**
     * Set filter LFO depth (0-1000 Hz)
     */
    setFilterLfoDepth(depth) {
        this.filterLfoDepth = Math.max(0, Math.min(1000, depth));
        if (this.filterLFOGain) this.filterLFOGain.gain.value = this.filterLfoDepth;
    },

    /**
     * Set attack time (0.1-10 seconds)
     */
    setAttackTime(seconds) {
        this.attackTime = Math.max(0.1, Math.min(10, seconds));
    },

    /**
     * Set release time (0.1-10 seconds)
     */
    setReleaseTime(seconds) {
        this.releaseTime = Math.max(0.1, Math.min(10, seconds));
    },

    /**
     * Set reverb size (duration + decay) and rebuild impulse
     */
    setReverbSize(duration, decay) {
        this.reverbDuration = Math.max(0.5, Math.min(6, duration));
        this.reverbDecay = Math.max(0.5, Math.min(5, decay));
        if (this.audioContext && this.convolver) {
            this.createReverbImpulse(this.reverbDuration, this.reverbDecay);
        }
    },

    /**
     * Load a preset by name
     */
    loadPreset(name) {
        const preset = this.presets[name];
        if (!preset) return;

        // Apply all preset values
        this.oscLevels = { ...preset.oscLevels };
        this.chorusDetune = preset.chorusDetune;
        this.octaveShift = preset.octaveShift;
        this.ampLfoRate = preset.ampLfoRate;
        this.ampLfoDepth = preset.ampLfoDepth;
        this.filterLfoRate = preset.filterLfoRate;
        this.filterLfoDepth = preset.filterLfoDepth;
        this.attackTime = preset.attackTime;
        this.releaseTime = preset.releaseTime;
        this.reverbDuration = preset.reverbDuration;
        this.reverbDecay = preset.reverbDecay;
        this.reverbMix = preset.reverbMix;
        this.volume = preset.volume;

        // Apply to audio nodes
        if (this.audioContext) {
            // Filter LFO
            if (this.filterLFO) this.filterLFO.frequency.value = this.filterLfoRate;
            if (this.filterLFOGain) this.filterLFOGain.gain.value = this.filterLfoDepth;

            // Reverb
            this.createReverbImpulse(this.reverbDuration, this.reverbDecay);
            if (this.reverbGain) this.reverbGain.gain.value = this.reverbMix;
            if (this.dryGain) this.dryGain.gain.value = 1 - (this.reverbMix * 0.3);

            // Filters
            this.setLowPass(preset.lowPassFreq / 20000);
            this.setHighPass((preset.highPassFreq - 20) / 1980);

            // Volume
            if (this.masterGain) this.masterGain.gain.value = this.volume;

            // Update live oscillators
            Object.values(this.activeSources).forEach(source => {
                if (source.lfoOsc) source.lfoOsc.frequency.value = this.ampLfoRate;
                if (source.lfoGain) source.lfoGain.gain.value = this.ampLfoDepth;
                const levels = [this.oscLevels.rootSine, this.oscLevels.rootTriangle, this.oscLevels.chorusL, this.oscLevels.chorusR, this.oscLevels.octaveUp, this.oscLevels.sub];
                source.oscillators.forEach(({ gain }, i) => {
                    if (levels[i] !== undefined) gain.gain.value = levels[i];
                });
                if (source.oscillators[2]) source.oscillators[2].osc.detune.value = this.chorusDetune;
                if (source.oscillators[3]) source.oscillators[3].osc.detune.value = -this.chorusDetune;
            });
        }

        // Update UI sliders to match preset
        this.syncUIToState();
        console.log(`Loaded preset: ${name}`);
    },

    /**
     * Sync all UI sliders to current state
     */
    syncUIToState() {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        // Main controls
        set('padsVolume', Math.round(this.volume * 100));
        set('padsCrossfade', Math.round(this.crossfade * 100));
        set('padsReverb', Math.round(this.reverbMix * 100));
        set('padsPan', Math.round(this.pan * 100));
        // Extended controls
        set('padsSynthRootSine', Math.round(this.oscLevels.rootSine * 100));
        set('padsSynthRootTri', Math.round(this.oscLevels.rootTriangle * 100));
        set('padsSynthChorus', Math.round(this.oscLevels.chorusL * 100));
        set('padsSynthOctave', Math.round(this.oscLevels.octaveUp * 100));
        set('padsSynthSub', Math.round(this.oscLevels.sub * 100));
        set('padsSynthDetune', this.chorusDetune);
        set('padsSynthAmpRate', Math.round(this.ampLfoRate * 100));
        set('padsSynthAmpDepth', Math.round(this.ampLfoDepth * 1000));
        set('padsSynthFiltRate', Math.round(this.filterLfoRate * 100));
        set('padsSynthFiltDepth', Math.round(this.filterLfoDepth / 10));
        set('padsSynthAttack', Math.round(this.attackTime * 10));
        set('padsSynthRelease', Math.round(this.releaseTime * 10));
        set('padsSynthReverbSize', Math.round(this.reverbDuration * 10));
        set('padsSynthReverbDecay', Math.round(this.reverbDecay * 10));
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
