import { MUSIC_STYLES, KEY_FREQUENCIES, SCALES, DEFAULT_TRACKS, MAX_STEPS, PERCUSSION_SOUNDS } from '../types/audio.ts';
import type { MusicStyle, Scale, Track, PatternStep, SynthParams, TrackEffects } from '../types/audio.ts';

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
    this.distortionNode.curve = this.makeDistortionCurve(50) as any;
    this.distortionNode.oversample = '4x';
    
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

  // Síntese de percussão melhorada com pitch decay e filtros apropriados
  playPercussion(soundName: keyof typeof PERCUSSION_SOUNDS, step: PatternStep) {
    if (!this.ctx) return;
    
    const sound = PERCUSSION_SOUNDS[soundName];
    if (!sound) return;

    const now = this.ctx.currentTime;
    const velocity = step.velocity;
    
    // Componente tonal (oscilador)
    if (sound.noise < 1) {
      const osc = this.ctx.createOscillator();
      osc.type = sound.type;
      osc.frequency.setValueAtTime(sound.frequency, now);
      
      // Pitch decay para drums (kick, toms) - desce a frequência rapidamente
      if (sound.pitchDecay && sound.pitchDecay > 0) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(sound.frequency * 0.1, 20),
          now + sound.pitchDecay
        );
      }
      
      const gain = this.ctx.createGain();
      const tonalGain = velocity * (1 - sound.noise);
      gain.gain.setValueAtTime(tonalGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + sound.decay);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(now);
      osc.stop(now + sound.decay + 0.01);
    }
    
    // Componente de ruído
    if (sound.noise > 0) {
      const bufferSize = Math.ceil(this.ctx.sampleRate * sound.decay);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Envelope de ruído com decay exponencial
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
      }
      
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      // Filtro apropriado para cada tipo de som
      const filter = this.ctx.createBiquadFilter();
      if (sound.noiseFilter && sound.noiseFilter > 0) {
        filter.type = 'highpass';
        filter.frequency.value = sound.noiseFilter * 0.5;
        filter.Q.value = 0.7;
      } else {
        filter.type = 'bandpass';
        filter.frequency.value = sound.frequency;
        filter.Q.value = 1.0;
      }
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(velocity * sound.noise * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + sound.decay);
      
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      
      noiseSource.start(now);
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

  // Padrões melódicos com movimento stepwise (graus conjuntos)
  generateMelodyPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    let currentDegree = Math.floor(scaleNotes.length / 2);
    let direction = 1;
    const stepsPerPhrase = 8;
    const cycleLength = 32;
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i >= cycleLength) {
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      const phrasePosition = i % stepsPerPhrase;
      
      // Nova frase a cada 8 steps
      if (phrasePosition === 0) {
        currentDegree = Math.floor(scaleNotes.length / 2) + (Math.random() > 0.5 ? 1 : -1);
        direction = Math.random() > 0.5 ? 1 : -1;
      }
      
      // Determinar se toca nota ou silêncio
      const shouldPlay = phrasePosition === 0 ? 0.9 :
                        phrasePosition === 4 ? 0.7 :
                        phrasePosition % 2 === 0 ? 0.5 :
                        0.25;
      
      if (Math.random() < shouldPlay) {
        // Movimento stepwise: sobe ou desce 1-2 graus
        const step = Math.random() > 0.7 ? 2 : 1;
        currentDegree += step * direction;
        
        // Inverter direção nas bordas
        if (currentDegree >= scaleNotes.length - 1) {
          direction = -1;
          currentDegree = scaleNotes.length - 1;
        } else if (currentDegree <= 0) {
          direction = 1;
          currentDegree = 0;
        }
        
        // Oitava variável para notas altas na segunda metade da frase
        const useHighOctave = phrasePosition >= 4 && Math.random() > 0.6;
        const baseNote = scaleNotes[currentDegree];
        const note = useHighOctave 
          ? baseNote.replace(/\d/, '') + '5' 
          : baseNote;
        
        pattern.push({
          note,
          velocity: 0.5 + (phrasePosition === 0 ? 0.2 : 0) + Math.random() * 0.2,
          duration: phrasePosition % 4 === 0 ? 0.6 : 0.35,
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
    let currentDegree = Math.floor(scaleNotes.length / 2);
    const phraseLength = 4;
    const cycleLength = 32;
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i >= cycleLength) {
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      const phrasePos = i % (phraseLength * 2);
      
      // Lead toca em frases de 4 notas com pausas
      if (phrasePos < phraseLength) {
        const notePos = phrasePos % phraseLength;
        
        if (notePos === 0 || (notePos === 2 && Math.random() > 0.4)) {
          // Nota principal da frase ou resposta
          if (notePos === 0) {
            currentDegree = Math.floor(Math.random() * scaleNotes.length);
          } else {
            // Resposta melódica: mover por grau
            currentDegree = Math.max(0, Math.min(scaleNotes.length - 1,
              currentDegree + (Math.random() > 0.5 ? 1 : -1)
            ));
          }
          
          pattern.push({
            note: scaleNotes[currentDegree],
            velocity: 0.7 + Math.random() * 0.2,
            duration: 0.5,
            glide: notePos === 0,
          });
        } else {
          pattern.push({ note: null, velocity: 0 });
        }
      } else {
        // Pausa entre frases
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generatePluckPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    // Arpejo da escala: 1-3-5-7-5-3 repetindo
    const arpDegrees = [0, 2, 4, 6, 4, 2];
    const cycleLength = 16;
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i >= cycleLength) {
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      // Pluck toca em colcheias alternadas
      if (i % 2 === 0) {
        const degree = arpDegrees[(Math.floor(i / 2)) % arpDegrees.length] % scaleNotes.length;
        pattern.push({
          note: scaleNotes[degree],
          velocity: 0.45 + (i % 8 === 0 ? 0.15 : 0) + Math.random() * 0.1,
          duration: 0.2,
        });
      } else {
        // Rests ocasionais para dar espaço
        if (Math.random() > 0.6) {
          pattern.push({ note: null, velocity: 0 });
        } else {
          const degree = arpDegrees[(Math.floor(i / 2)) % arpDegrees.length] % scaleNotes.length;
          pattern.push({
            note: scaleNotes[degree],
            velocity: 0.3,
            duration: 0.15,
          });
        }
      }
    }
    
    return pattern;
  }

  generateArpPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    // Arpejo ascendente/descendente suave
    const arpSequence = [0, 2, 4, 7, 7, 4, 2, 0];
    const cycleLength = 16;
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i >= cycleLength) {
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      const noteIndex = arpSequence[i % arpSequence.length];
      const actualIndex = ((noteIndex % scaleNotes.length) + scaleNotes.length) % scaleNotes.length;
      
      // Velocity crescente no início de cada grupo de 8
      const groupPos = i % 8;
      const velocity = groupPos === 0 ? 0.65 : 0.4 + (groupPos % 2 === 0 ? 0.05 : 0);
      
      pattern.push({
        note: scaleNotes[actualIndex],
        velocity: velocity + Math.random() * 0.1,
        duration: 0.15,
      });
    }
    
    return pattern;
  }

  generateBassPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 2);
    const pattern: PatternStep[] = [];
    // Progressão de baixo: tônica e quinta com walking ocasional
    const bassPattern = [0, 0, 4, 0, 0, 0, 4, 2];
    const cycleLength = 16;
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i >= cycleLength) {
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      const beat = i % 8;
      const degree = bassPattern[beat] % scaleNotes.length;
      
      if (beat === 0) {
        // Tônica forte no downbeat
        pattern.push({
          note: scaleNotes[degree],
          velocity: 0.9,
          duration: 0.8,
        });
      } else if (beat === 4) {
        // Segundo beat forte
        pattern.push({
          note: scaleNotes[degree],
          velocity: 0.75,
          duration: 0.6,
        });
      } else if (beat % 2 === 0 && Math.random() > 0.5) {
        // Notas de passagem ocasionais
        pattern.push({
          note: scaleNotes[degree],
          velocity: 0.55,
          duration: 0.3,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateSubPattern(): PatternStep[] {
    // Sub usa oitava 1 (abaixo do bass) para não sobrepor frequências
    const rootNote = `${this.currentKey}1`;
    const fifthNote = this.generateScaleNotes(this.currentKey, 1)[4] || rootNote;
    const pattern: PatternStep[] = [];
    const cycleLength = 32;
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i >= cycleLength) {
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      if (i % 16 === 0) {
        // Tônica longa a cada 16 steps
        pattern.push({
          note: rootNote,
          velocity: 0.85,
          duration: 4.0,
        });
      } else if (i % 16 === 8) {
        // Quinta como ponto de apoio
        pattern.push({
          note: fifthNote,
          velocity: 0.6,
          duration: 2.0,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generatePadPattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 3);
    const scaleNotes4 = this.generateScaleNotes(this.currentKey, 4);
    const pattern: PatternStep[] = [];
    
    // Progressão harmônica diatônica: I - IV - V - vi (graus da escala)
    const chordProgressions = [
      [0, 2, 4],    // I (tônica)
      [3, 5, 0],    // IV (subdominante) - com oitava
      [4, 6, 1],    // V (dominante)
      [5, 0, 2],    // vi (relativo menor)
    ];
    
    const chordDuration = 16; // cada acorde dura 16 steps
    const cycleLength = chordDuration * chordProgressions.length;
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i >= cycleLength) {
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      if (i % chordDuration === 0) {
        const progIndex = Math.floor(i / chordDuration) % chordProgressions.length;
        const degrees = chordProgressions[progIndex];
        
        const chordNotes = degrees.map(degree => {
          if (degree < scaleNotes.length) return scaleNotes[degree];
          return scaleNotes4[degree - scaleNotes.length] || scaleNotes[degree % scaleNotes.length];
        }).filter(Boolean);
        
        if (chordNotes.length > 0) {
          pattern.push({
            note: chordNotes.join(','),
            velocity: 0.45 + (progIndex === 0 ? 0.1 : 0),
            duration: chordDuration,
          });
        } else {
          pattern.push({ note: null, velocity: 0 });
        }
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  generateDronePattern(): PatternStep[] {
    const scaleNotes = this.generateScaleNotes(this.currentKey, 2);
    const pattern: PatternStep[] = [];
    
    // Drone: tônica + quinta sustentadas por toda a sequência
    const droneNotes = [scaleNotes[0], scaleNotes[4]].filter(Boolean);
    
    for (let i = 0; i < this.stepCount; i++) {
      if (i === 0) {
        pattern.push({
          note: droneNotes.join(','),
          velocity: 0.35,
          duration: this.stepCount,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  // Padrão de efeitos com colocação intencional
  generateEffectPattern(): PatternStep[] {
    const pattern: PatternStep[] = [];
    const stepCount = this.stepCount;
    const cycleLength = 64;
    
    for (let i = 0; i < stepCount; i++) {
      if (i >= cycleLength && i !== stepCount - 1) { // Manter o final original
        pattern.push({ ...pattern[i % cycleLength] });
        continue;
      }
      // Efeitos apenas em momentos estruturais importantes
      const isPhraseStart = i % 32 === 0;
      const isMidPhrase = i % 32 === 16;
      const isEnd = i === stepCount - 1;
      
      if (isPhraseStart) {
        // Rise no início de seções
        pattern.push({
          note: 'rise',
          velocity: 0.5,
          duration: 2.0,
        });
      } else if (isMidPhrase) {
        // Sweep no meio de seções longas
        if (Math.random() > 0.5) {
          pattern.push({
            note: 'sweep',
            velocity: 0.4,
            duration: 1.5,
          });
        } else {
          pattern.push({ note: null, velocity: 0 });
        }
      } else if (isEnd) {
        // Impact no final
        pattern.push({
          note: 'impact',
          velocity: 0.6,
          duration: 1.0,
        });
      } else {
        pattern.push({ note: null, velocity: 0 });
      }
    }
    
    return pattern;
  }

  // Padrão de percussão com velocidade correta por som e alinhamento
  generateDrumPattern(): PatternStep[] {
    const pattern: PatternStep[] = [];
    const totalSteps = this.stepCount;
    // Usar 16 como base de repetição (sempre múltiplo de 16 para alinhamento correto)
    const cycleLength = Math.min(16, totalSteps);
    
    for (let i = 0; i < totalSteps; i++) {
      const stepInCycle = i % cycleLength;
      const sounds: string[] = [];
      const velocities: Record<string, number> = {};
      
      switch (this.currentStyle.drumPattern) {
        case 'four-on-floor':
          if (stepInCycle % 4 === 0) {
            sounds.push('kick');
            velocities['kick'] = 0.95;
          }
          if (stepInCycle % 8 === 4) {
            sounds.push('snare');
            velocities['snare'] = 0.8;
          }
          if (stepInCycle % 2 === 0) {
            sounds.push('hihat');
            velocities['hihat'] = stepInCycle % 4 === 2 ? 0.35 : 0.25;
          }
          // Open hat no upbeat
          if (stepInCycle % 4 === 3 && stepInCycle % 8 !== 7) {
            sounds.push('openhat');
            velocities['openhat'] = 0.3;
          }
          break;
          
        case 'breakbeat':
          if (stepInCycle === 0 || stepInCycle === 3 || stepInCycle === 8 || stepInCycle === 11) {
            sounds.push('kick');
            velocities['kick'] = 0.9;
          }
          if (stepInCycle === 4 || stepInCycle === 12) {
            sounds.push('snare');
            velocities['snare'] = 0.85;
          }
          // Hi-hat em semicolcheias no breakbeat
          if (stepInCycle % 2 === 0) {
            sounds.push('hihat');
            velocities['hihat'] = stepInCycle % 4 === 0 ? 0.35 : 0.22;
          }
          break;
          
        case 'half-time':
          if (stepInCycle === 0) {
            sounds.push('kick');
            velocities['kick'] = 0.95;
          }
          if (stepInCycle === 8) {
            sounds.push('snare');
            velocities['snare'] = 0.85;
          }
          if (stepInCycle % 4 === 2) {
            sounds.push('hihat');
            velocities['hihat'] = 0.3;
          }
          // Ghost snare
          if (stepInCycle === 12 && Math.random() > 0.5) {
            sounds.push('snare');
            velocities['snare'] = 0.4;
          }
          break;
          
        case 'syncopated':
          if (stepInCycle === 0 || stepInCycle === 6 || stepInCycle === 10) {
            sounds.push('kick');
            velocities['kick'] = 0.9;
          }
          if (stepInCycle === 4 || stepInCycle === 12) {
            sounds.push('snare');
            velocities['snare'] = 0.8;
          }
          // Hi-hat sincopado com variação
          if (stepInCycle % 2 === 0) {
            sounds.push(stepInCycle % 6 === 2 ? 'openhat' : 'hihat');
            velocities[stepInCycle % 6 === 2 ? 'openhat' : 'hihat'] = 0.3;
          }
          break;
          
        case 'sparse':
          if (stepInCycle === 0) {
            sounds.push('kick');
            velocities['kick'] = 0.8;
          }
          if (stepInCycle === 8) {
            sounds.push('snare');
            velocities['snare'] = 0.6;
          }
          if (stepInCycle % 8 === 4) {
            sounds.push('hihat');
            velocities['hihat'] = 0.2;
          }
          break;
      }
      
      // Variações por estilo (com velocities separadas)
      if (this.currentStyle.category === 'urban' && stepInCycle % 4 === 3) {
        if (!sounds.includes('rim')) {
          sounds.push('rim');
          velocities['rim'] = 0.45;
        }
      }
      
      // Trap: hi-hats em semicolcheias
      if (this.currentStyle.id === 'trap' && stepInCycle % 2 === 1) {
        const hihatVariation = stepInCycle % 4 === 1 ? 'hihat' : 'openhat';
        sounds.push(hihatVariation);
        velocities[hihatVariation] = 0.25;
      }
      
      // Phonk: cowbell pattern
      if (this.currentStyle.id === 'phonk' && stepInCycle % 4 === 2) {
        sounds.push('cowbell');
        velocities['cowbell'] = 0.5;
      }
      
      // Calcular velocity final como média dos sons presentes
      let finalVelocity = 0;
      if (sounds.length > 0) {
        finalVelocity = sounds.reduce((sum, s) => sum + (velocities[s] || 0.5), 0) / sounds.length;
      }
      
      pattern.push({
        note: sounds.length > 0 ? sounds.join(',') : null,
        velocity: finalVelocity,
        duration: 0.2,
      });
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

    // Duração do step em segundos baseada no BPM
    const stepDurationSec = (60 / this.bpm) / 4;

    this.tracks.forEach(track => {
      if (track.muted) return;

      const step = track.pattern[this.currentStep];
      if (!step || step.velocity === 0) return;

      // Usar duração do step se definida, senão usar padrão do tipo
      const noteDuration = step.duration || stepDurationSec;

      switch (track.type) {
        case 'melody':
          if (step.note) this.playMelody(step.note, { ...step, duration: noteDuration }, track);
          break;
        case 'lead':
          if (step.note) this.playLead(step.note, { ...step, duration: noteDuration }, track);
          break;
        case 'pluck':
          if (step.note) this.playPluck(step.note, { ...step, duration: noteDuration }, track);
          break;
        case 'arp':
          if (step.note) this.playArp([step.note], { ...step, duration: noteDuration }, this.currentStep, track);
          break;
        case 'bass':
          if (step.note) this.playBass(step.note, { ...step, duration: noteDuration }, track);
          break;
        case 'sub':
          if (step.note) this.playSub(step.note, { ...step, duration: noteDuration }, track);
          break;
        case 'pad':
          if (step.note) {
            const notes = step.note.split(',');
            this.playPad(notes, { ...step, duration: noteDuration }, track);
          }
          break;
        case 'drone':
          if (step.note && this.currentStep === 0) {
            const notes = step.note.split(',');
            this.playDrone(notes, { ...step, duration: noteDuration }, track);
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
            // Efeitos com sons apropriados por tipo
            const effectType = step.note;
            const effects = track.effects || { reverb: 0.7, delay: 0.5, distortion: 0.3, chorus: 0.4, phaser: 0.4 };
            
            if (effectType === 'rise') {
              // Sweep ascendente
              this.playSynthNote(200, noteDuration, step.velocity * 0.4, {
                waveform: 'sawtooth', attack: 0.05, decay: noteDuration * 0.8,
                sustain: 0.3, release: noteDuration * 0.2,
                filterCutoff: 1500, filterResonance: 8, detune: 0, unison: 1
              }, effects);
            } else if (effectType === 'fall') {
              // Sweep descendente
              this.playSynthNote(800, noteDuration, step.velocity * 0.4, {
                waveform: 'sawtooth', attack: noteDuration * 0.3, decay: noteDuration * 0.7,
                sustain: 0.2, release: 0.1,
                filterCutoff: 800, filterResonance: 6, detune: 0, unison: 1
              }, effects);
            } else if (effectType === 'impact') {
              // Impacto percussivo
              this.playPercussion('crash', step);
            } else if (effectType === 'sweep') {
              // Filtro sweep
              this.playSynthNote(300, noteDuration, step.velocity * 0.3, {
                waveform: 'triangle', attack: 0.01, decay: noteDuration,
                sustain: 0.1, release: 0.3,
                filterCutoff: 2000, filterResonance: 12, detune: 0, unison: 1
              }, effects);
            } else {
              // Noise ou outros
              this.playPercussion('shaker', step);
            }
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
      track.effects = { ...(track.effects as TrackEffects), ...effects } as TrackEffects;
      
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
      track.synthParams = { ...(track.synthParams as SynthParams), ...params } as SynthParams;
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
