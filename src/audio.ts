export class LoFiSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;

  constructor() {}

  public async init() {
    if (this.isInitialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.08; // soft volume
    
    // Create a gentle lowpass filter to make it "lo-fi" and warm
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600; // Cut off high frequencies
    
    this.gainNode.connect(filter);
    filter.connect(this.ctx.destination);

    // Add some noise (vinyl crackle simulation)
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.015; // Very quiet noise
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 800;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(this.gainNode);
    noiseSource.start();

    this.isInitialized = true;
  }

  private playNote() {
    if (!this.ctx || !this.gainNode) return;
    
    const osc = this.ctx.createOscillator();
    
    // Choose a warm waveform
    osc.type = 'sine'; // sine or triangle is softest
    
    // Chill pentatonic/diatonic notes
    const chillNotes = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25]; // C minor pentatonic
    const freq = chillNotes[Math.floor(Math.random() * chillNotes.length)];
    
    // Add some random detune for lo-fi warble
    osc.detune.value = (Math.random() - 0.5) * 15;
    
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    const noteGain = this.ctx.createGain();
    
    // Envelope: slow attack, long release
    noteGain.gain.setValueAtTime(0, this.ctx.currentTime);
    noteGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5);
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);
    
    osc.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 4.0);
  }

  public async toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      await this.start();
      return true;
    }
  }

  public async start() {
    if (this.isPlaying) return;
    await this.init();
    if (this.ctx?.state === 'suspended') {
        await this.ctx.resume();
    }
    this.isPlaying = true;
    
    // Play immediately
    this.playNote();
    
    // Then loop
    this.intervalId = window.setInterval(() => {
        // Random chance to play a note (sparse, ambient feel)
        if (Math.random() > 0.2) {
            this.playNote();
        }
        
        // Sometimes play a double note for a chord-like effect
        if (Math.random() > 0.8) {
            setTimeout(() => this.playNote(), 300);
        }
    }, 1800);
  }

  public async playMechanicalSound() {
    await this.init();
    if (this.ctx?.state === 'suspended') {
        await this.ctx.resume();
    }
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    
    // Sub-bass rumble (activating)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(30, time);
    subOsc.frequency.linearRampToValueAtTime(60, time + 0.5);
    subOsc.frequency.exponentialRampToValueAtTime(10, time + 1.2);
    
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0, time);
    subGain.gain.linearRampToValueAtTime(0.8, time + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.01, time + 1.2);
    
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(time);
    subOsc.stop(time + 1.2);

    // Sci-fi power up (chord/sweep)
    const powerOsc = this.ctx.createOscillator();
    powerOsc.type = 'triangle';
    powerOsc.frequency.setValueAtTime(200, time);
    powerOsc.frequency.exponentialRampToValueAtTime(800, time + 0.6);
    
    const powerGain = this.ctx.createGain();
    powerGain.gain.setValueAtTime(0, time);
    powerGain.gain.linearRampToValueAtTime(0.2, time + 0.3);
    powerGain.gain.exponentialRampToValueAtTime(0.01, time + 1.0);
    
    powerOsc.connect(powerGain);
    powerGain.connect(this.ctx.destination);
    powerOsc.start(time);
    powerOsc.stop(time + 1.0);

    // Mechanical click / unlock
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(2000, time + 0.3);
    clickOsc.frequency.exponentialRampToValueAtTime(100, time + 0.35);
    
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0, time + 0.29);
    clickGain.gain.setValueAtTime(0.3, time + 0.3);
    clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
    
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(time + 0.3);
    clickOsc.stop(time + 0.4);
    
    // White noise "whoosh" (air pressure release)
    const bufferSize = this.ctx.sampleRate * 1.5; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(100, time + 0.4);
    noiseFilter.frequency.exponentialRampToValueAtTime(3000, time + 0.6);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, time + 1.2);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, time + 0.4);
    noiseGain.gain.linearRampToValueAtTime(0.15, time + 0.6);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 1.2);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    noiseSource.start(time + 0.4);
  }

  public playScratchSound() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    
    const time = this.ctx.currentTime;
    
    const bufferSize = this.ctx.sampleRate * 0.05; // very short sound
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500, time);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noiseSource.start(time);
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
        this.ctx.suspend();
    }
  }
}

export const synth = new LoFiSynth();
