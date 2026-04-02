import { MUSIC_STYLES, KEY_FREQUENCIES, SCALES, DEFAULT_TRACKS, MAX_STEPS, PERCUSSION_SOUNDS } from '../types/audio.ts';
import type { MusicStyle, Scale, Track, PatternStep, TrackType, SynthParams, TrackEffects } from '../types/audio.ts';

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
  private distortionNode: WaveShaperNode | null = null;
  private chorusNode: DelayNode | null = null;
  private phaserNode: BiquadFilterNode | null = null;
  private trackGainNodes: Map<string, GainNode> = new Map();
  private trackPannerNodes: Map<string, StereoPannerNode> = new Map();
  private trackEffectsNodes: Map<string, { reverb: GainNode; delay: GainNode; distortion: GainNode }> = new Map();
  private stepCount: number = MAX_STEPS;

  async init() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.createMasterEffects();
    this.initializeTracks();
  }

  private createMasterEffects() {
    if (!this.ctx) return;
    
    // Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createImpulseResponse(2.0, 2.0);
    
    // Delay
    this.delayNode = this.ctx.createDelay(5.0);
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.value = 0.3;
    this.delayNode.connect(delayFeedback);
    delayFeedback.connect(this.delayNode);
    
    // Distortion
    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(50);
    this.distortionNode.oversample = '4x';
    
    // Chorus
    this.chorusNode = this.ctx.createDelay(0.05);
    
    // Phaser
    this.phaserNode = this.ctx.createBiquadFilter();
    this.phaserNode.type = 'allpass';
    this.phaserNode.frequency.value = 1000;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const sampleRate = this.ctx!.sampleRate;
    const curve = new Float32Array(sampleRate);
    const deg = Math.PI / 180;
    for (let i = 0; i < sampleRate; i++) {
      const x = (i * 2) / sampleRate - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
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

  private initializeTracks() {
    this.tracks = DEFAULT_TRACKS.map((track, index) => ({
      ...track,
      id: `track-${index}`,
      pattern: Array(this.stepCount).fill(null).map(() => ({ note: null, velocity: 0 })),
    }));
    
    // Criar nós de áudio para cada track
    this.tracks.forEach(track => {
      this.createTrackAudioNodes(track);
    });
  }

  private createTrackAudioNodes(track: Track) {
    if (!this.ctx) return;
    
    // Gain node para volume
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = track.volume;
    this.trackGainNodes.set(track.id, gainNode);
    
    // Panner para posicionamento estéreo
    const pannerNode = this.ctx.createStereoPanner();
    pannerNode.pan.value = track.pan;
    this.trackPannerNodes.set(track.id, pannerNode);
    
    // Nós de efeitos
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = track.effects?.reverb || 0;
    
    const delayGain = this.ctx.createGain();
    delayGain.gain.value = track.effects?.delay || 0;
    
    const distortionGain = this.ctx.createGain();
    distortionGain.gain.value = track.effects?.distortion || 0;
    
    this.trackEffectsNodes.set(track.id, {
      reverb: reverbGain,
      delay: delayGain,
      distortion: distortionGain,
    });
    
    // Conectar cadeia de áudio
    gainNode.connect(pannerNode);
    pannerNode.connect(this.masterGain!);
    
    // Conectar efeitos
    pannerNode.connect(reverbGain);
    reverbGain.connect(this.reverbNode!);
    this.reverbNode!.connect(this.masterGain!);
    
    pannerNode.connect(delayGain);
    delayGain.connect(this.delayNode!);
    this.delayNode!.connect(this.masterGain!);
    
    pannerNode.connect(distortionGain);
    distortionGain.connect(this.distortionNode!);
    this.distortionNode!.connect(this.masterGain!);
  }

  // Síntese avançada com ADSR
  playSynthNote(
    frequency: number, 
    duration: number, 
    velocity: number, 
    params: SynthParams,
    effects: TrackEffects
  ) {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Oscilador principal
    const osc = this.ctx.createOscillator();
    osc.type = params.waveform as OscillatorType;
    osc.frequency.setValueAtTime(frequency, now);
    
    // Unison (para sons mais grossos)
    const oscillators: OscillatorNode[] = [osc];
    const unisonCount = params.unison || 1;
    
    if (unisonCount > 1) {
      for (let i = 1; i < unisonCount; i++) {
        const unisonOsc = this.ctx.createOscillator();
        unisonOsc.type = params.waveform as OscillatorType;
        const detune = (params.detune || 0) * (i - (unisonCount - 1) / 2);
        unisonOsc.detune.value = detune;
        unisonOsc.frequency.setValueAtTime(frequency, now);
        oscillators.push(unisonOsc);
      }
    }
    
    // Filtro
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(params.filterCutoff, now);
    filter.Q.value = params.filterResonance;
    
    // ADSR Envelope
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity, now + params.attack);
    gainNode.gain.linearRampToValueAtTime(velocity * params.sustain, now + params.attack + params.decay);
    gainNode.gain.setValueAtTime(velocity * params.sustain, now + duration - params.release);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    // Conectar tudo
    oscillators.forEach(o => {
      o.connect(filter);
    });
    filter.connect(gainNode);
    gainNode.connect(this.masterGain!);
    
    // Efeitos adicionais
    if (effects.chorus > 0) {
      const chorusDelay = this.ctx.createDelay(0.05);
      const chorusGain = this.ctx.createGain();
      chorusGain.gain.value = effects.chorus * 0.5;
      gainNode.connect(chorusDelay);
      chorusDelay.connect(chorusGain);
      chorusGain.connect(this.masterGain!);
    }
    
    if (effects.phaser > 0) {
      const phaser = this.ctx.createBiquadFilter();
      phaser.type = 'allpass';
      phaser.frequency.value = 1000;
      const phaserLFO = this.ctx.createOscillator();
      phaserLFO.frequency.value = 0.5;
      const phaserGain = this.ctx.createGain();
      phaserGain.gain.value = effects.phaser * 1000;
      phaserLFO.connect(phaserGain);
      phaserGain.connect(phaser.frequency);
      gainNode.connect(phaser);
      phaser.connect(this.masterGain!);
    }
    
    // Iniciar e parar
    oscillators.forEach(o => {
      o.start(now);
      o.stop(now + duration);
    });
  }

  // Som de percussão avançado
  playPercussion(soundName: keyof typeof PERCUSSION_SOUNDS, step: PatternStep) {
    if (!this.ctx) return;
    
    const sound = PERCUSSION_SOUNDS[soundName];
    if (!sound) return;

    const now = this.ctx.currentTime;
    
    if (sound.noise > 0) {
      // Som com ruído (snare, clap, etc)
      const bufferSize = this.ctx.sampleRate * sound.decay;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = sound.name === 'Snare' || sound.name === 'Clap' ? 'highpass' : 'bandpass';
      filter.frequency.value = sound.frequency;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(step.velocity * sound.noise, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + sound.decay);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      
      noise.start(now);
    }
    
    if (sound.noise < 1) {
      // Som tonal (kick, tom, etc)
      const osc = this.ctx.createOscillator();
      osc.type = sound.type;
      osc.frequency.setValueAtTime(sound.frequency, now);
      osc.frequency.exponentialRampToValueAtTime(sound.frequency * 0.1, now + sound.decay);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(step.velocity * (1 - sound.noise), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + sound.decay);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now);
      osc.stop(now + sound.decay);
    }
  }

  // Métodos legados atualizados
  playNote(frequency: number, duration: number, volume: number, type: string = 'sine') {
    this.playSynthNote(frequency, duration, volume, {
      waveform: type as any,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
      filterCutoff: 2000,
      filterResonance: 5,
      detune: 0,
      unison: 1,
    }, { reverb: 0.3, delay: 0.2, distortion: 0, chorus: 0.3, phaser: 0.1 });
  }

  playKick(step: PatternStep) {
    this.playPercussion('kick', step);
  }

  playSnare(step: PatternStep) {
    this.playPercussion('snare', step);
  }

  playHiHat(step: PatternStep) {
    this.playPercussion('hihat', step);
  }

  playClap(step: PatternStep) {
    this.playPercussion('clap', step);
  }

  playBass(note: string, step: PatternStep, track?: Track) {
    const freq = KEY_FREQUENCIES[note];
    if (freq && track?.synthParams) {
      this.playSynthNote(freq, 0.8, step.velocity * 0.8, track.synthParams, track.effects || { reverb: 0.1, delay: 0.05, distortion: 0.2, chorus: 0, phaser: 0 });
    }
  }

  playMelody(note: string, step: PatternStep, track?: Track) {
    const freq = KEY_FREQUENCIES[note];
    if (freq && track?.synthParams) {
      this.playSynthNote(freq, 0.4, step.velocity, track.synthParams, track.effects || { reverb: 0.3, delay: 0.2, distortion: 0, chorus: 0.3, phaser: 0.1 });
    }
  }

  playPad(notes: string[], step: PatternStep, track?: Track) {
    if (!track?.synthParams) return;
    
    notes.forEach((note, index) => {
      const freq = KEY_FREQUENCIES[note];
      if (freq) {
        setTimeout(() => {
          this.playSynthNote(freq, 2.0, step.velocity * 0.6, {
            ...track.synthParams!,
            attack: track.synthParams!.attack * 2,
          }, track.effects || { reverb: 0.6, delay: 0.4, distortion: 0, chorus: 0.5, phaser: 0.3 });
        }, index * 50);
      }
    });
  }

  playLead(note: string, step: PatternStep, track?: Track) {
    const freq = KEY_FREQUENCIES[note];
    if (freq && track?.synthParams) {
      this.playSynthNote(freq, 0.6, step.velocity, track.synthParams, track.effects || { reverb: 0.4, delay: 0.3, distortion: 0.1, chorus: 0.2, phaser: 0.2 });
    }
  }

  playPluck(note: string, step: PatternStep, track?: Track) {
    const freq = KEY_FREQUENCIES[note];
    if (freq && track?.synthParams) {
      this.playSynthNote(freq, 0.3, step.velocity * 0.9, track.synthParams, track.effects || { reverb: 0.25, delay: 0.15, distortion: 0, chorus: 0.1, phaser: 0 });
    }
  }

  playArp(notes: string[], step: PatternStep, stepIndex: number, track?: Track) {
    if (!track?.synthParams || notes.length === 0) return;
    
    const note = notes[stepIndex % notes.length];
    const freq = KEY_FREQUENCIES[note];
    if (freq) {
      this.playSynthNote(freq, 0.15, step.velocity, track.synthParams, track.effects || { reverb: 0.35, delay: 0.25, distortion: 0, chorus: 0.2, phaser: 0.1 });
    }
  }

  playSub(note: string, step: PatternStep, track?: Track) {
    const freq = KEY_FREQUENCIES[note];
    if (freq && track?.synthParams) {
      this.playSynthNote(freq, 1.0, step.velocity * 0.9, track.synthParams, track.effects || { reverb: 0.05, delay: 0, distortion: 0.1, chorus: 0, phaser: 0 });
    }
  }

  playDrone(notes: string[], step: PatternStep, track?: Track) {
    if (!track?.synthParams) return;
    
    notes.forEach(note => {
      const freq = KEY_FREQUENCIES[note];
      if (freq) {
        this.playSynthNote(freq, 8.0, step.velocity * 0.5, track.synthParams!, track.effects || { reverb: 0.8, delay: 0.6, distortion: 0.1, chorus: 0.6, phaser: 0.5 });
      }
    });
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

  // Padrões melódicos avançados
  generateMelodyPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < this.stepCount; i++) {
      // Melodia mais complexa com variação por posição
      const probability = i % 8 === 0 ? 0.8 : i % 4 === 0 ? 0.6 : 0.3;
      
      if (Math.random() < probability) {
        const noteIndex = Math.floor(Math.random() * scaleNotes.length);
        const octave = Math.random() > 0.7 ? 5 : 4;
        const note = scaleNotes[noteIndex].replace(/\d/, '') + octave;
        
        pattern.push({
          note,
          velocity: 0.4 + Math.random() * 0.4,
          duration: 0.5 + Math.random() * 0.5,
          glide: Math.random() > 0.8,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateLeadPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 5);
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < this.stepCount; i++) {
      const probability = i % 16 === 0 ? 0.9 : i % 8 === 4 ? 0.7 : 0.2;
      
      if (Math.random() < probability) {
        const noteIndex = Math.floor(Math.random() * scaleNotes.length);
        pattern.push({
          note: scaleNotes[noteIndex],
          velocity: 0.6 + Math.random() * 0.4,
          duration: 0.8,
          glide: true,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generatePluckPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    const arpSequence = [0, 2, 4, 2, 0, 3, 5, 3];
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i % 2 === 0 && Math.random() > 0.3) {
        const noteIndex = arpSequence[i % arpSequence.length] % scaleNotes.length;
        pattern.push({
          note: scaleNotes[noteIndex],
          velocity: 0.5 + Math.random() * 0.3,
          duration: 0.3,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateArpPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    const arpSequence = [0, 2, 4, 7, 4, 2, 0, -2];
    
    for (let i = 0; i < this.stepCount; i++) {
      const noteIndex = arpSequence[i % arpSequence.length];
      const actualIndex = ((noteIndex % scaleNotes.length) + scaleNotes.length) % scaleNotes.length;
      
      pattern.push({
        note: scaleNotes[actualIndex],
        velocity: 0.4 + Math.random() * 0.3,
        duration: 0.15,
      });
    }
    
    return pattern;
  }

  generateBassPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 2);
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < this.stepCount; i++) {
      // Bass mais musical seguindo a estrutura harmônica
      const isStrongBeat = i % 8 === 0;
      const isMediumBeat = i % 4 === 0;
      
      if (isStrongBeat) {
        pattern.push({
          note: scaleNotes[0],
          velocity: 1.0,
          duration: 1.0,
        });
      } else if (isMediumBeat && Math.random() > 0.5) {
        const noteIndex = Math.floor(Math.random() * Math.min(3, scaleNotes.length));
        pattern.push({
          note: scaleNotes[noteIndex],
          velocity: 0.8,
          duration: 0.5,
        });
      } else if (Math.random() > 0.8) {
        pattern.push({
          note: scaleNotes[0],
          velocity: 0.6,
          duration: 0.25,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateSubPattern(): PatternStep[] {
    const rootNote = `${this.currentKey}1`;
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i % 8 === 0) {
        pattern.push({
          note: rootNote,
          velocity: 0.95,
          duration: 2.0,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generatePadPattern(): PatternStep[] {
    const scaleNotes = [
      ...this.generateScaleNotes(this.currentKey, 3),
      ...this.generateScaleNotes(this.currentKey, 4),
    ];
    const pattern: PatternStep[] = [];
    
    // Chords de pad a cada 8 steps
    const chordIntervals = [[0, 2, 4], [0, 2, 4, 6], [0, 3, 4]];
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i % 8 === 0) {
        const chordIndex = Math.floor(i / 8) % chordIntervals.length;
        const intervals = chordIntervals[chordIndex];
        const chordNotes = intervals.map(interval => scaleNotes[interval % scaleNotes.length]);
        
        pattern.push({
          note: chordNotes.join(','),
          velocity: 0.5 + Math.random() * 0.2,
          duration: 8.0,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateDronePattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 2);
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i === 0) {
        const droneNotes = [scaleNotes[0], scaleNotes[2], scaleNotes[4]].filter(Boolean);
        pattern.push({
          note: droneNotes.join(','),
          velocity: 0.4,
          duration: this.stepCount,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  // Padrões de percussão estilizados
  generateDrumPattern(): PatternStep[] {
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < this.stepCount; i++) {
      const sounds: string[] = [];
      let velocity = 0;
      
      switch (this.currentStyle.drumPattern) {
        case 'four-on-floor':
          if (i % 4 === 0) {
            sounds.push('kick');
            velocity = 1.0;
          }
          if (i % 8 === 4) {
            sounds.push('snare');
            velocity = 0.8;
          }
          if (i % 2 === 1) {
            sounds.push('hihat');
            velocity = 0.4;
          }
          break;
          
        case 'breakbeat':
          if (i % 8 === 0 || i % 8 === 3) {
            sounds.push('kick');
            velocity = 1.0;
          }
          if (i % 8 === 4 || i % 8 === 6) {
            sounds.push('snare');
            velocity = 0.85;
          }
          if (i % 2 === 1) {
            sounds.push('hihat');
            velocity = i % 4 === 3 ? 0.5 : 0.3;
          }
          break;
          
        case 'half-time':
          if (i % 8 === 0) {
            sounds.push('kick');
            velocity = 1.0;
          }
          if (i % 8 === 4) {
            sounds.push('snare');
            velocity = 0.9;
          }
          if (i % 4 === 2) {
            sounds.push('hihat');
            velocity = 0.5;
          }
          break;
          
        case 'syncopated':
          if (i % 8 === 0 || (i % 8 === 5 && Math.random() > 0.5)) {
            sounds.push('kick');
            velocity = 0.9;
          }
          if (i % 8 === 3 || i % 8 === 7) {
            sounds.push('snare');
            velocity = 0.75;
          }
          if (i % 2 === 1 || i % 4 === 2) {
            sounds.push(i % 3 === 0 ? 'hihat' : 'openhat');
            velocity = 0.4;
          }
          break;
          
        case 'sparse':
          if (i % 16 === 0) {
            sounds.push('kick');
            velocity = 0.8;
          }
          if (i % 16 === 8) {
            sounds.push('snare');
            velocity = 0.6;
          }
          if (Math.random() > 0.9) {
            sounds.push('hihat');
            velocity = 0.3;
          }
          break;
      }
      
      // Adicionar variações extras baseadas no estilo
      if (this.currentStyle.category === 'urban' && i % 4 === 3) {
        sounds.push('rim');
        velocity = Math.max(velocity, 0.5);
      }
      
      if (this.currentStyle.id === 'trap' && i % 2 === 1 && Math.random() > 0.3) {
        sounds.push(Math.random() > 0.5 ? 'hihat' : 'openhat');
      }
      
      pattern.push({
        note: sounds.length > 0 ? sounds.join(',') : null,
        velocity,
        duration: 0.2,
      });
    }
    
    return pattern;
  }

  generateEffectPattern(): PatternStep[] {
    const pattern: PatternStep[] = [];
    
    for (let i = 0; i < this.stepCount; i++) {
      const probability = this.currentStyle.intensity === 'extreme' ? 0.1 : 
                          this.currentStyle.intensity === 'high' ? 0.08 : 0.05;
      
      if (Math.random() < probability) {
        const effects = ['sweep', 'noise', 'impact', 'rise', 'fall'];
        pattern.push({
          note: effects[Math.floor(Math.random() * effects.length)],
          velocity: 0.5 + Math.random() * 0.3,
          duration: 2.0,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  autoGenerate() {
    this.tracks.forEach(track => {
      switch (track.type) {
        case 'melody':
          track.pattern = this.generateMelodyPattern();
          break;
        case 'lead':
          track.pattern = this.generateLeadPattern();
          break;
        case 'pluck':
          track.pattern = this.generatePluckPattern();
          break;
        case 'arp':
          track.pattern = this.generateArpPattern();
          break;
        case 'bass':
          track.pattern = this.generateBassPattern();
          break;
        case 'sub':
          track.pattern = this.generateSubPattern();
          break;
        case 'pad':
          track.pattern = this.generatePadPattern();
          break;
        case 'drone':
          track.pattern = this.generateDronePattern();
          break;
        case 'percussion':
          track.pattern = this.generateDrumPattern();
          break;
        case 'effect':
          track.pattern = this.generateEffectPattern();
          break;
      }
    });
  }

  playStep() {
    if (!this.isPlaying) return;

    this.tracks.forEach(track => {
      if (track.muted) return;

      const step = track.pattern[this.currentStep];
      if (!step || step.velocity === 0) return;

      switch (track.type) {
        case 'melody':
          if (step.note) this.playMelody(step.note, step, track);
          break;
        case 'lead':
          if (step.note) this.playLead(step.note, step, track);
          break;
        case 'pluck':
          if (step.note) this.playPluck(step.note, step, track);
          break;
        case 'arp':
          if (step.note) this.playArp([step.note], step, this.currentStep, track);
          break;
        case 'bass':
          if (step.note) this.playBass(step.note, step, track);
          break;
        case 'sub':
          if (step.note) this.playSub(step.note, step, track);
          break;
        case 'pad':
          if (step.note) {
            const notes = step.note.split(',');
            this.playPad(notes, step, track);
          }
          break;
        case 'drone':
          if (step.note && this.currentStep === 0) {
            const notes = step.note.split(',');
            this.playDrone(notes, step, track);
          }
          break;
        case 'percussion':
          if (step.note) {
            const sounds = step.note.split(',');
            sounds.forEach(sound => {
              if (PERCUSSION_SOUNDS[sound as keyof typeof PERCUSSION_SOUNDS]) {
                this.playPercussion(sound as keyof typeof PERCUSSION_SOUNDS, step);
              }
            });
          }
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

    this.currentStep = (this.currentStep + 1) % this.stepCount;
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

  setStepCount(count: number) {
    this.stepCount = Math.min(Math.max(16, count), MAX_STEPS);
    // Ajustar padrões existentes
    this.tracks.forEach(track => {
      const newPattern = Array(this.stepCount).fill(null).map((_, i) => 
        track.pattern[i] || { note: null, velocity: 0 }
      );
      track.pattern = newPattern;
    });
  }

  setTrackPattern(trackId: string, pattern: PatternStep[]) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.pattern = pattern.slice(0, this.stepCount);
    }
  }

  toggleTrackMute(trackId: string) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.muted = !track.muted;
      
      // Atualizar nó de ganho
      const gainNode = this.trackGainNodes.get(trackId);
      if (gainNode) {
        gainNode.gain.setValueAtTime(track.muted ? 0 : track.volume, this.ctx?.currentTime || 0);
      }
    }
  }

  setTrackVolume(trackId: string, volume: number) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.volume = volume;
      
      const gainNode = this.trackGainNodes.get(trackId);
      if (gainNode && !track.muted) {
        gainNode.gain.setValueAtTime(volume, this.ctx?.currentTime || 0);
      }
    }
  }

  setTrackPan(trackId: string, pan: number) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.pan = pan;
      
      const pannerNode = this.trackPannerNodes.get(trackId);
      if (pannerNode) {
        pannerNode.pan.setValueAtTime(pan, this.ctx?.currentTime || 0);
      }
    }
  }

  setTrackEffects(trackId: string, effects: Partial<TrackEffects>) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.effects = { ...track.effects, ...effects };
      
      // Atualizar nós de efeitos
      const effectNodes = this.trackEffectsNodes.get(trackId);
      if (effectNodes) {
        if (effects.reverb !== undefined) {
          effectNodes.reverb.gain.setValueAtTime(effects.reverb, this.ctx?.currentTime || 0);
        }
        if (effects.delay !== undefined) {
          effectNodes.delay.gain.setValueAtTime(effects.delay, this.ctx?.currentTime || 0);
        }
        if (effects.distortion !== undefined) {
          effectNodes.distortion.gain.setValueAtTime(effects.distortion, this.ctx?.currentTime || 0);
        }
      }
    }
  }

  setTrackSynthParams(trackId: string, params: Partial<SynthParams>) {
    const track = this.tracks.find(t => t.id === trackId);
    if (track) {
      track.synthParams = { ...track.synthParams, ...params };
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

  getStepCount() {
    return this.stepCount;
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
