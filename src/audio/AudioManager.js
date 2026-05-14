/**
 * MusicDirector handles high-precision scheduling for the generative soundscape.
 * Implements the Web Worker Scheduling pattern for jitter-free audio timing.
 */
class MusicDirector {
    constructor(audioContext, masterGain) {
        this.ctx = audioContext;
        this.masterGain = masterGain;
        this.isPlaying = false;
        this.nextNoteTime = 0;
        this.currentStep = 0;
        
        // Ambient Drone scale: C minor 9 / Atmospheric textures
        this.notes = [65.41, 73.42, 77.78, 87.31, 98.00, 110.00, 130.81]; // C2 to C3
        
        this.filterCutoff = 800;
        this._initWorker();
    }

    _initWorker() {
        const workerCode = `
            let timerID = null;
            self.onmessage = (e) => {
                if (e.data === 'start') {
                    if (timerID) return;
                    timerID = setInterval(() => postMessage('tick'), 50);
                } else if (e.data === 'stop') {
                    if (timerID) {
                        clearInterval(timerID);
                        timerID = null;
                    }
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        this.worker.onmessage = () => this.schedule();
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.nextNoteTime = this.ctx.currentTime;
        this.worker.postMessage('start');
    }

    stop() {
        this.isPlaying = false;
        this.worker.postMessage('stop');
    }

    schedule() {
        // Schedule notes in advance to ensure precision
        while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
            this.playLayer(this.nextNoteTime);
            this.advanceStep();
        }
    }

    advanceStep() {
        // Slow, overlapping ambient pulses
        const secondsPerPulse = 2.0;
        this.nextNoteTime += secondsPerPulse * (0.8 + Math.random() * 0.4);
        this.currentStep++;
    }

    playLayer(time) {
        const osc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Atmospheric Sawtooth + Triangle blend
        osc.type = 'sawtooth';
        subOsc.type = 'triangle';
        
        // Procedural note selection from the scale
        const freq = this.notes[Math.floor(Math.random() * this.notes.length)];
        osc.frequency.setValueAtTime(freq, time);
        subOsc.frequency.setValueAtTime(freq * 0.5, time); // Sub-octave
        
        // Random slight detune for thickness
        osc.detune.setValueAtTime(Math.random() * 10 - 5, time);

        filter.type = 'lowpass';
        // Filter is reactive to mouse speed via this.filterCutoff
        filter.frequency.setValueAtTime(this.filterCutoff, time);
        filter.Q.setValueAtTime(8, time);

        // Slow attack and decay for ambient feel
        const attack = 1.0;
        const decay = 2.5;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, time + attack + decay);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        subOsc.start(time);
        osc.stop(time + attack + decay);
        subOsc.stop(time + attack + decay);
    }
}

/**
 * AudioManager: Aura's main interface for the reactive generative soundscape.
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicDirector = null;
        this.lastMousePos = { x: 0, y: 0 };
        this.mouseSpeed = 0;
        this.initialized = false;
    }

    /**
     * Initializes the AudioContext on user interaction.
     */
    init() {
        if (this.initialized) return;
        
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        
        // Optional: Add a master limiter/compressor
        const limiter = this.ctx.createDynamicsCompressor();
        limiter.threshold.setValueAtTime(-10, this.ctx.currentTime);
        limiter.knee.setValueAtTime(40, this.ctx.currentTime);
        limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
        limiter.attack.setValueAtTime(0, this.ctx.currentTime);
        limiter.release.setValueAtTime(0.25, this.ctx.currentTime);

        this.masterGain.connect(limiter);
        limiter.connect(this.ctx.destination);

        this.musicDirector = new MusicDirector(this.ctx, this.masterGain);
        this.musicDirector.start();
        
        this.initialized = true;
        console.log('Aura: Generative Soundscape Initialized');
    }

    /**
     * Updates reactivity based on cursor movement.
     * @param {Object} mouse - The normalized mouse position {x, y}.
     */
    update(mouse) {
        if (!this.initialized || !mouse) return;

        // Calculate Euclidean distance as speed
        const dx = mouse.x - this.lastMousePos.x;
        const dy = mouse.y - this.lastMousePos.y;
        const currentSpeed = Math.sqrt(dx * dx + dy * dy);
        
        // Low-pass filter for smooth speed tracking
        this.mouseSpeed += (currentSpeed - this.mouseSpeed) * 0.15;
        
        this.lastMousePos.x = mouse.x;
        this.lastMousePos.y = mouse.y;

        // Map mouse speed to filter cutoff (400Hz to 12kHz)
        // High speed = more high-frequency content (filter opens)
        const targetCutoff = 400 + (this.mouseSpeed * 35000);
        this.setFilterCutoff(Math.min(12000, targetCutoff));
    }

    setFilterCutoff(value) {
        if (this.musicDirector) {
            this.musicDirector.filterCutoff = value;
        }
    }

    playScanSound() {
        if (!this.initialized) return;

        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const sweepEnv = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(40, time);
        osc.frequency.exponentialRampToValueAtTime(2000, time + 1.5);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(40, time);
        filter.frequency.exponentialRampToValueAtTime(2000, time + 1.5);
        filter.Q.setValueAtTime(10, time);

        sweepEnv.gain.setValueAtTime(0, time);
        sweepEnv.gain.linearRampToValueAtTime(0.2, time + 0.1);
        sweepEnv.gain.linearRampToValueAtTime(0, time + 1.5);

        osc.connect(filter);
        filter.connect(sweepEnv);
        sweepEnv.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 1.5);
    }
}
