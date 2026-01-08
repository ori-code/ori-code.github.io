/**
 * ChordsApp Metronome
 * Professional metronome with tap tempo, time signatures, and multiple sounds
 */

const metronome = {
    // Audio context
    audioContext: null,

    // State
    isPlaying: false,
    currentBeat: 0,
    nextNoteTime: 0,
    timerID: null,

    // Settings
    bpm: 120,
    beatsPerMeasure: 4,  // Time signature numerator
    beatUnit: 4,          // Time signature denominator
    volume: 0.7,
    soundType: 'click',   // 'click', 'beep', 'wood'
    accentFirstBeat: true,
    multiplier: 1,        // Speed multiplier (1 = normal, 2 = double time, 0.5 = half time)

    // Tap tempo
    tapTimes: [],
    tapTimeout: null,

    // Audio nodes
    masterGain: null,

    // Scheduling
    scheduleAheadTime: 0.1,  // How far ahead to schedule audio (seconds)
    lookahead: 25,           // How often to call scheduler (milliseconds)

    /**
     * Initialize the metronome
     */
    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        console.log('Metronome initialized');
    },

    /**
     * Start the metronome
     */
    async start() {
        if (this.isPlaying) return;

        await this.init();

        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioContext.currentTime;

        this.scheduler();
        this.updateUI();

        console.log(`Metronome started at ${this.bpm} BPM`);
    },

    /**
     * Stop the metronome
     */
    stop() {
        this.isPlaying = false;

        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }

        this.currentBeat = 0;
        this.updateUI();

        console.log('Metronome stopped');
    },

    /**
     * Toggle play/stop
     */
    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    },

    /**
     * Scheduler - runs ahead of time to schedule notes
     */
    scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }

        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    },

    /**
     * Schedule a single note
     */
    scheduleNote(beatNumber, time) {
        // With multiplier, accent on original measure boundaries
        // e.g., with x2 and 4/4, accent on beats 0 and 4 (every 4 clicks)
        const isAccent = this.accentFirstBeat && (beatNumber % this.beatsPerMeasure === 0);
        this.playClick(time, isAccent);

        // Schedule UI update - show beat within original measure
        const delay = (time - this.audioContext.currentTime) * 1000;
        const displayBeat = beatNumber % this.beatsPerMeasure;
        setTimeout(() => {
            this.updateBeatIndicator(displayBeat);
        }, Math.max(0, delay));
    },

    /**
     * Advance to next note
     */
    nextNote() {
        // Apply multiplier to effective BPM (clicks faster without changing displayed BPM)
        const effectiveBpm = this.bpm * this.multiplier;
        const secondsPerBeat = 60.0 / effectiveBpm;
        this.nextNoteTime += secondsPerBeat;

        this.currentBeat++;
        // Adjust beats per measure based on multiplier
        const effectiveBeatsPerMeasure = this.beatsPerMeasure * this.multiplier;
        if (this.currentBeat >= effectiveBeatsPerMeasure) {
            this.currentBeat = 0;
        }
    },

    /**
     * Play click sound
     */
    playClick(time, isAccent = false) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        // Different sounds based on type
        switch (this.soundType) {
            case 'beep':
                osc.type = 'sine';
                osc.frequency.value = isAccent ? 1000 : 800;
                gainNode.gain.setValueAtTime(isAccent ? 0.8 : 0.5, time);
                gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
                osc.start(time);
                osc.stop(time + 0.1);
                break;

            case 'wood':
                osc.type = 'triangle';
                osc.frequency.value = isAccent ? 1200 : 900;
                gainNode.gain.setValueAtTime(isAccent ? 1 : 0.6, time);
                gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
                osc.start(time);
                osc.stop(time + 0.05);
                break;

            case 'click':
            default:
                osc.type = 'square';
                osc.frequency.value = isAccent ? 1500 : 1200;
                gainNode.gain.setValueAtTime(isAccent ? 0.6 : 0.4, time);
                gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
                osc.start(time);
                osc.stop(time + 0.03);
                break;
        }
    },

    /**
     * Set BPM
     */
    setBpm(value) {
        this.bpm = Math.max(20, Math.min(300, Math.round(value)));
        this.updateBpmDisplay();
        console.log(`BPM set to ${this.bpm}`);
    },

    /**
     * Increase BPM
     */
    increaseBpm(amount = 1) {
        this.setBpm(this.bpm + amount);
    },

    /**
     * Decrease BPM
     */
    decreaseBpm(amount = 1) {
        this.setBpm(this.bpm - amount);
    },

    /**
     * Tap tempo - call this on each tap
     */
    tap() {
        const now = Date.now();

        // Clear old taps after 2 seconds
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }

        this.tapTimes.push(now);

        // Keep only last 8 taps
        if (this.tapTimes.length > 8) {
            this.tapTimes.shift();
        }

        // Calculate BPM from intervals
        if (this.tapTimes.length >= 2) {
            let totalInterval = 0;
            for (let i = 1; i < this.tapTimes.length; i++) {
                totalInterval += this.tapTimes[i] - this.tapTimes[i - 1];
            }
            const avgInterval = totalInterval / (this.tapTimes.length - 1);
            const calculatedBpm = Math.round(60000 / avgInterval);
            this.setBpm(calculatedBpm);
        }

        // Reset taps after 2 seconds of inactivity
        this.tapTimeout = setTimeout(() => {
            this.tapTimes = [];
        }, 2000);

        // Visual feedback
        const tapBtn = document.getElementById('metronome-tap-btn');
        if (tapBtn) {
            tapBtn.classList.add('tapped');
            setTimeout(() => tapBtn.classList.remove('tapped'), 100);
        }
    },

    /**
     * Set time signature
     */
    setTimeSignature(beats, unit) {
        this.beatsPerMeasure = beats;
        this.beatUnit = unit;
        this.currentBeat = 0;
        this.updateTimeSignatureDisplay();
        this.createBeatIndicators();
        console.log(`Time signature set to ${beats}/${unit}`);
    },

    /**
     * Set volume
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
    },

    /**
     * Set sound type
     */
    setSoundType(type) {
        this.soundType = type;
        console.log(`Sound type set to ${type}`);
    },

    /**
     * Set speed multiplier (1 = normal, 2 = double time, 0.5 = half time)
     */
    setMultiplier(value) {
        const oldMultiplier = this.multiplier;
        this.multiplier = value;

        // Adjust timing for smooth transition when playing
        if (this.isPlaying && this.audioContext && oldMultiplier !== value) {
            const currentTime = this.audioContext.currentTime;
            const newEffectiveBpm = this.bpm * value;
            const newSecondsPerBeat = 60.0 / newEffectiveBpm;

            // Calculate time since last beat
            const oldEffectiveBpm = this.bpm * oldMultiplier;
            const oldSecondsPerBeat = 60.0 / oldEffectiveBpm;
            const timeSinceLastBeat = oldSecondsPerBeat - (this.nextNoteTime - currentTime);

            // Scale the elapsed time to the new tempo and calculate next beat
            const scaledElapsed = timeSinceLastBeat * (oldMultiplier / value);
            const timeToNextBeat = Math.max(0.01, newSecondsPerBeat - scaledElapsed);

            this.nextNoteTime = currentTime + timeToNextBeat;
        }

        this.updateMultiplierUI();
        console.log(`Multiplier set to x${value}`);
    },

    /**
     * Toggle between x1 and x2
     */
    toggleDoubleTime() {
        this.setMultiplier(this.multiplier === 2 ? 1 : 2);
    },

    /**
     * Update multiplier UI buttons
     */
    updateMultiplierUI() {
        // Modal multiplier buttons
        document.querySelectorAll('.metronome-mult-btn').forEach(btn => {
            const mult = parseFloat(btn.dataset.mult);
            btn.classList.toggle('active', mult === this.multiplier);
        });

        // Mini player multiplier button
        const miniMultBtn = document.getElementById('miniMetronomeMult');
        if (miniMultBtn) {
            miniMultBtn.textContent = `x${this.multiplier}`;
            miniMultBtn.classList.toggle('active', this.multiplier !== 1);
        }
    },

    /**
     * Update UI elements
     */
    updateUI() {
        // Modal play button
        const playBtn = document.getElementById('metronome-play-btn');
        if (playBtn) {
            playBtn.innerHTML = this.isPlaying ? '⏹️ Stop' : '▶️ Play';
            playBtn.classList.toggle('playing', this.isPlaying);
        }

        // Mini player play button
        const miniPlayBtn = document.getElementById('miniMetronomePlay');
        if (miniPlayBtn) {
            miniPlayBtn.innerHTML = this.isPlaying ? '⏹' : '▶';
            miniPlayBtn.classList.toggle('playing', this.isPlaying);
        }
    },

    /**
     * Update BPM display
     */
    updateBpmDisplay() {
        // Modal BPM display
        const bpmDisplay = document.getElementById('metronome-bpm-display');
        if (bpmDisplay) {
            bpmDisplay.textContent = this.bpm;
        }

        // Modal BPM slider
        const bpmSlider = document.getElementById('metronome-bpm-slider');
        if (bpmSlider) {
            bpmSlider.value = this.bpm;
        }

        // Mini player BPM display
        const miniBpmDisplay = document.getElementById('miniMetronomeBpm');
        if (miniBpmDisplay) {
            miniBpmDisplay.textContent = this.bpm;
        }

        // Mini player BPM slider
        const miniBpmSlider = document.getElementById('miniMetronomeBpmSlider');
        if (miniBpmSlider) {
            miniBpmSlider.value = this.bpm;
        }
    },

    /**
     * Update time signature display
     */
    updateTimeSignatureDisplay() {
        const tsDisplay = document.getElementById('metronome-time-signature');
        if (tsDisplay) {
            tsDisplay.textContent = `${this.beatsPerMeasure}/${this.beatUnit}`;
        }
    },

    /**
     * Create beat indicator dots
     */
    createBeatIndicators() {
        const container = document.getElementById('metronome-beats');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < this.beatsPerMeasure; i++) {
            const dot = document.createElement('div');
            dot.className = 'beat-dot' + (i === 0 ? ' accent' : '');
            dot.dataset.beat = i;
            container.appendChild(dot);
        }
    },

    /**
     * Update beat indicator
     */
    updateBeatIndicator(beat) {
        const dots = document.querySelectorAll('.beat-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === beat);
        });
    }
};

// Expose globally
window.metronome = metronome;

console.log('Metronome module loaded');
