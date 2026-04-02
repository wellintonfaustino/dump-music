import { MUSIC_STYLES, KEY_FREQUENCIES, SCALES, DEFAULT_TRACKS } from '../types/audio.ts';
import type { MusicStyle, Scale, Track, PatternStep, Note } from '../types/audio.ts';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private stepInterval: number | null = null;
  private bpm: number = 120;
  private tracks: Track[] = [];
  private currentStyle: MusicStyle = MUSIC_STYLES[0];
  private currentKey: string = 'C';
  private currentScale: Scale = SCALES.major;
  private onStepCallback: ((step: number) => void) | null = null;
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;

  async init() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.createEffects();
    this.initializeTracks();
  }

  private createEffects() {
    if (!this.ctx) return;
    
    this.reverbNode = this.ctx.createConvolver();
    this.delayNode = this.ctx.createDelay(2.0);
    
    const delayGain = this.ctx.createGain();
    delayGain.gain.value = 0.3;
    
    this.delayNode.connect(delayGain);
    delayGain.connect(this.delayNode);
    this.delayNode.connect(this.masterGain!);
  }

  private initializeTracks() {
    this.tracks = DEFAULT_TRACKS.map((track, index) => ({
      ...track,
      id: `track-${index}`,
      pattern: Array(16).fill(null).map(() => ({ note: null, velocity: 0 })),
    }));
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx!.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    return impulse;
  }

  playNote(frequency: number, duration: number, volume: number, type: string = 'sine') {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = type as OscillatorType;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
    filter.Q.value = 5;
    
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain!);
    
    if (this.reverbNode) {
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = 0.2;
      gainNode.connect(reverbGain);
      reverbGain.connect(this.reverbNode);
    }
    
    if (this.delayNode) {
      const delayGain = this.ctx.createGain();
      delayGain.gain.value = 0.15;
      gainNode.connect(delayGain);
      delayGain.connect(this.delayNode);
    }
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  playKick(step: PatternStep) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(step.velocity, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playSnare(step: PatternStep) {
    if (!this.ctx) return;
    
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(step.velocity * 0.5, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    
    noise.start();
  }

  playHiHat(step: PatternStep) {
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = 10000;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    
    gain.gain.setValueAtTime(step.velocity * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playBass(note: string, step: PatternStep) {
    const freq = KEY_FREQUENCIES[note];
    if (freq) {
      this.playNote(freq, 0.8, step.velocity * 0.8, 'sawtooth');
    }
  }

  playMelody(note: string, step: PatternStep) {
    const freq = KEY_FREQUENCIES[note];
    if (freq) {
      this.playNote(freq, 0.4, step.velocity, 'sine');
    }
  }

  generateScaleNotes(baseNote: string, octave: number): string[] {
    const baseIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(baseNote.replace(/\d/, ''));
    const scaleIntervals = this.currentScale.notes;
    
    return scaleIntervals.map(interval => {
      const noteIndex = (baseIndex + interval) % 12;
      const noteOctave = octave + Math.floor((baseIndex + interval) / 12);
      const note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][noteIndex];
      return `${note}${noteOctave}`;
    });
  }

  generateMelodyPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < 16; i++) {
      if (Math.random() > 0.6) {
        const noteIndex = Math.floor(Math.random() * scaleNotes.length);
        pattern.push({
          note: scaleNotes[noteIndex],
          velocity: 0.6 + Math.random() * 0.4,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateBassPattern(): PatternStep[] {
    const rootNote = `${this.currentKey}2`;
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 0) {
        pattern.push({
          note: rootNote,
          velocity: 0.9,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateDrumPattern(): PatternStep[] {
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 0) {
        pattern.push({ note: 'kick', velocity: 1.0 });
      } else if (i % 8 === 4) {
        pattern.push({ note: 'snare', velocity: 0.8 });
      } else if (i % 2 === 1) {
        pattern.push({ note: 'hihat', velocity: 0.4 });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateEffectPattern(): PatternStep[] {
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < 16; i++) {
      if (Math.random() > 0.85) {
        pattern.push({
          note: 'effect',
          velocity: 0.5 + Math.random() * 0.3,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  autoGenerate() {
    this.tracks[0].pattern = this.generateMelodyPattern();
    this.tracks[1].pattern = this.generateBassPattern();
    this.tracks[2].pattern = this.generateDrumPattern();
    this.tracks[3].pattern = this.generateEffectPattern();
  }

  playStep() {
    if (!this.isPlaying) return;

    this.tracks.forEach(track => {
      if (track.muted) return;

      const step = track.pattern[this.currentStep];
      if (!step || step.velocity === 0) return;

      switch (track.type) {
        case 'melody':
          if (step.note) this.playMelody(step.note, step);
          break;
        case 'bass':
          if (step.note) this.playBass(step.note, step);
          break;
        case 'percussion':
          if (step.note === 'kick') this.playKick(step);
          else if (step.note === 'snare') this.playSnare(step);
          else if (step.note === 'hihat') this.playHiHat(step);
          break;
        case 'effect':
          if (step.note) {
            this.playNote(440 + Math.random() * 440, 0.2, step.velocity, 'triangle');
          }
          break;
      }
    });

    if (this.onStepCallback) {
      this.onStepCallback(this.currentStep);
    }

    this.currentStep = (this.currentStep + 1) % 16;
  }

  play() {
    if (!this.ctx) {
      this.init().then(() => this.startPlayback());
    } else {
      this.startPlayback();
    }
  }

  private startPlayback() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.currentStep = 0;
    
    const stepDuration = (60 / this.bpm) * 1000 / 4;
    
    this.stepInterval = window.setInterval(() => {
      this.playStep();
    }, stepDuration);
  }

  pause() {
    this.isPlaying = false;
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  stop() {
    this.pause();
    this.currentStep = 0;
  }

  setBPM(bpm: number) {
    this.bpm = bpm;
    if (this.isPlaying) {
      this.pause();
      this.startPlayback();
    }
  }

  setStyle(style: MusicStyle) {
    this.currentStyle = style;
    this.bpm = style.bpm;
    this.currentScale = { name: 'Custom', notes: style.baseScale };
    
    if (this.isPlaying) {
      this.pause();
      this.startPlayback();
    }
  }

  setKey(key: string) {
    this.currentKey = key;
  }

  setScale(scale: Scale) {
    this.currentScale = scale;
  }

  setTrackPattern(trackId: string, pattern: PatternStep[]) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.pattern = pattern;
    }
  }

  toggleTrackMute(trackId: string) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.muted = !track.muted;
    }
  }

  setTrackVolume(trackId: string, volume: number) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.volume = volume;
    }
  }

  getTracks() {
    return this.tracks;
  }

  getCurrentStep() {
    return this.currentStep;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  onStep(callback: (step: number) => void) {
    this.onStepCallback = callback;
  }

  clearStepCallback() {
    this.onStepCallback = null;
  }
}

export const audioEngine = new AudioEngine();
