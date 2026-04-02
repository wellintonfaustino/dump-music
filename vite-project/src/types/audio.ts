export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Octave = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Scale {
  name: string;
  notes: number[];
}

export type MusicStyle = {
  id: string;
  name: string;
  bpm: number;
  baseScale: number[];
  description: string;
  color: string;
  category: 'electronic' | 'urban' | 'organic' | 'experimental' | 'classic';
  drumPattern: 'four-on-floor' | 'breakbeat' | 'half-time' | 'syncopated' | 'sparse';
  intensity: 'low' | 'medium' | 'high' | 'extreme';
};

export interface PatternStep {
  note: string | null;
  velocity: number;
  duration?: number;
  glide?: boolean;
}

export type TrackType = 'melody' | 'bass' | 'percussion' | 'effect' | 'pad' | 'arp' | 'pluck' | 'lead' | 'sub' | 'drone';

export interface Track {
  id: string;
  name: string;
  pattern: PatternStep[];
  muted: boolean;
  volume: number;
  pan: number;
  type: TrackType;
  synthParams?: SynthParams;
  effects?: TrackEffects;
}

export interface SynthParams {
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterCutoff: number;
  filterResonance: number;
  detune?: number;
  unison?: number;
}

export interface TrackEffects {
  reverb: number;
  delay: number;
  distortion: number;
  chorus: number;
  phaser: number;
}

export interface Project {
  name: string;
  bpm: number;
  key: string;
  scale: string;
  style: string;
  tracks: Track[];
  stepCount: number;
}

// Constantes de notas e oitavas
export const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const OCTAVES: Octave[] = [1, 2, 3, 4, 5, 6, 7];

// Constante para número de passos (120 para sequências longas)
export const MAX_STEPS = 120;
export const DEFAULT_STEPS = 120;

// Escalas musicais
export const SCALES: Record<string, Scale> = {
  major: { name: 'Maior', notes: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'Menor', notes: [0, 2, 3, 5, 7, 8, 10] },
  pentatonic: { name: 'Pentatônica Maior', notes: [0, 2, 4, 7, 9] },
  minorPentatonic: { name: 'Pentatônica Menor', notes: [0, 3, 5, 7, 10] },
  blues: { name: 'Blues', notes: [0, 3, 5, 6, 7, 10] },
  dorian: { name: 'Dórica', notes: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { name: 'Frígia', notes: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { name: 'Lídia', notes: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { name: 'Mixolídia', notes: [0, 2, 4, 5, 7, 9, 10] },
  locrian: { name: 'Lócria', notes: [0, 1, 3, 5, 6, 8, 10] },
  arabic: { name: 'Árabe', notes: [0, 1, 4, 5, 7, 8, 11] },
  japanese: { name: 'Japonesa (Hirajoshi)', notes: [0, 2, 3, 7, 8] },
  hungarian: { name: 'Húngara Menor', notes: [0, 2, 3, 6, 7, 8, 11] },
  spanish: { name: 'Espanhola', notes: [0, 1, 4, 5, 7, 8, 10] },
  wholeTone: { name: 'Tons Inteiros', notes: [0, 2, 4, 6, 8, 10] },
  diminished: { name: 'Diminuta', notes: [0, 2, 3, 5, 6, 8, 9, 11] },
  augmented: { name: 'Aumentada', notes: [0, 3, 4, 7, 8, 11] },
  bebopDominant: { name: 'Bebop Dominante', notes: [0, 2, 4, 5, 7, 9, 10, 11] },
  altered: { name: 'Alterada', notes: [0, 1, 3, 4, 6, 8, 10] },
};

// Parâmetros de sintetizador padrão por tipo de instrumento
export const DEFAULT_SYNTH_PARAMS: Record<TrackType, SynthParams> = {
  melody: { waveform: 'sine', attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4, filterCutoff: 2500, filterResonance: 2, detune: 0, unison: 1 },
  lead: { waveform: 'square', attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.4, filterCutoff: 1800, filterResonance: 2, detune: 2, unison: 2 },
  pluck: { waveform: 'sawtooth', attack: 0.01, decay: 0.6, sustain: 0.2, release: 0.4, filterCutoff: 3000, filterResonance: 2, detune: 3, unison: 2 },
  bass: { waveform: 'sawtooth', attack: 0.02, decay: 0.4, sustain: 0.7, release: 0.3, filterCutoff: 1000, filterResonance: 3, detune: 5, unison: 2 },
  sub: { waveform: 'sine', attack: 0.05, decay: 0.4, sustain: 0.9, release: 0.5, filterCutoff: 150, filterResonance: 1, detune: 0, unison: 1 },
  pad: { waveform: 'sawtooth', attack: 0.8, decay: 0.5, sustain: 0.8, release: 2.0, filterCutoff: 1200, filterResonance: 2, detune: 12, unison: 4 },
  arp: { waveform: 'square', attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.2, filterCutoff: 2000, filterResonance: 4, detune: 4, unison: 2 },
  percussion: { waveform: 'noise', attack: 0.001, decay: 0.2, sustain: 0, release: 0.1, filterCutoff: 10000, filterResonance: 0, detune: 0, unison: 1 },
  effect: { waveform: 'triangle', attack: 0.1, decay: 0.5, sustain: 0.4, release: 1.0, filterCutoff: 3000, filterResonance: 7, detune: 0, unison: 1 },
  drone: { waveform: 'sawtooth', attack: 2.5, decay: 0.5, sustain: 1.0, release: 3.0, filterCutoff: 700, filterResonance: 4, detune: 25, unison: 8 },
};

// Efeitos padrão por tipo de instrumento
export const DEFAULT_TRACK_EFFECTS: Record<TrackType, TrackEffects> = {
  melody: { reverb: 0.4, delay: 0.2, distortion: 0, chorus: 0.3, phaser: 0.1 },
  lead: { reverb: 0.5, delay: 0.3, distortion: 0.0, chorus: 0.4, phaser: 0.1 },
  pluck: { reverb: 0.3, delay: 0.15, distortion: 0.05, chorus: 0.2, phaser: 0.05 },
  bass: { reverb: 0.1, delay: 0.05, distortion: 0.1, chorus: 0, phaser: 0 },
  sub: { reverb: 0.02, delay: 0, distortion: 0.05, chorus: 0, phaser: 0 },
  pad: { reverb: 0.7, delay: 0.4, distortion: 0, chorus: 0.5, phaser: 0.3 },
  arp: { reverb: 0.4, delay: 0.25, distortion: 0, chorus: 0.2, phaser: 0.1 },
  percussion: { reverb: 0.1, delay: 0, distortion: 0.05, chorus: 0, phaser: 0 },
  effect: { reverb: 0.7, delay: 0.5, distortion: 0.3, chorus: 0.4, phaser: 0.4 },
  drone: { reverb: 0.8, delay: 0.6, distortion: 0.1, chorus: 0.6, phaser: 0.5 },
};

// Estilos musicais expandidos (30+ estilos)
export const MUSIC_STYLES: MusicStyle[] = [
  // Eletrônica - House e variantes
  { id: 'house', name: 'House', bpm: 128, baseScale: [0, 2, 4, 5, 7, 9, 11], description: '4/4 com kick forte', color: '#e94560', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'medium' },
  { id: 'deep-house', name: 'Deep House', bpm: 122, baseScale: [0, 2, 3, 5, 7, 8, 10], description: 'Atmosférico e groovy', color: '#1e3a5f', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'low' },
  { id: 'progressive-house', name: 'Progressive House', bpm: 128, baseScale: [0, 2, 4, 6, 7, 9, 11], description: 'Builds épicos e drops', color: '#00d4ff', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'high' },
  { id: 'future-house', name: 'Future House', bpm: 126, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Síntese moderna e bass', color: '#7b2cbf', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'high' },
  { id: 'bass-house', name: 'Bass House', bpm: 128, baseScale: [0, 3, 5, 6, 7, 10], description: 'Foco em bass e groove', color: '#ff006e', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'extreme' },
  
  // Eletrônica - Techno e variantes
  { id: 'techno', name: 'Techno', bpm: 135, baseScale: [0, 3, 5, 7, 10], description: 'Industrial e repetitivo', color: '#00ff88', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'high' },
  { id: 'minimal-techno', name: 'Minimal Techno', bpm: 128, baseScale: [0, 2, 5, 7, 10], description: 'Redução ao essencial', color: '#2d3436', category: 'electronic', drumPattern: 'sparse', intensity: 'low' },
  { id: 'industrial-techno', name: 'Industrial Techno', bpm: 140, baseScale: [0, 1, 3, 5, 6, 8, 10], description: 'Ruído e percussão pesada', color: '#2d3436', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'extreme' },
  { id: 'melodic-techno', name: 'Melodic Techno', bpm: 125, baseScale: [0, 2, 3, 5, 7, 8, 10], description: 'Atmosferas emocionais', color: '#636e72', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'medium' },
  
  // Eletrônica - Trance e variantes
  { id: 'trance', name: 'Trance', bpm: 140, baseScale: [0, 2, 4, 6, 7, 9, 11], description: 'Melódico e progressivo', color: '#9d4edd', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'high' },
  { id: 'psytrance', name: 'Psytrance', bpm: 145, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Psicodélico e energético', color: '#ff6b35', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'extreme' },
  { id: 'uplifting-trance', name: 'Uplifting Trance', bpm: 138, baseScale: [0, 2, 4, 6, 7, 9, 11], description: 'Emocional e épico', color: '#00b894', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'high' },
  { id: 'hard-trance', name: 'Hard Trance', bpm: 150, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Agresivo e rápido', color: '#d63031', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'extreme' },
  
  // Bass Music
  { id: 'dubstep', name: 'Dubstep', bpm: 140, baseScale: [0, 3, 5, 7, 10], description: 'Wobble bass e syncopado', color: '#ff6b35', category: 'electronic', drumPattern: 'half-time', intensity: 'high' },
  { id: 'riddim', name: 'Riddim', bpm: 150, baseScale: [0, 3, 5, 6, 7, 10], description: 'Bass pesado e repetição', color: '#fd79a8', category: 'electronic', drumPattern: 'half-time', intensity: 'extreme' },
  { id: 'brostep', name: 'Brostep', bpm: 140, baseScale: [0, 3, 5, 7, 10], description: 'Bass agressivo e screams', color: '#e17055', category: 'electronic', drumPattern: 'half-time', intensity: 'extreme' },
  { id: 'drum-and-bass', name: 'Drum & Bass', bpm: 174, baseScale: [0, 2, 3, 5, 7, 8, 10], description: 'Breakbeats rápidos e bass', color: '#6c5ce7', category: 'electronic', drumPattern: 'breakbeat', intensity: 'high' },
  { id: 'neurofunk', name: 'Neurofunk', bpm: 174, baseScale: [0, 3, 5, 7, 10], description: 'Bass complexo e dark', color: '#2d3436', category: 'electronic', drumPattern: 'breakbeat', intensity: 'extreme' },
  { id: 'jump-up', name: 'Jump Up', bpm: 174, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Energético e bouncy', color: '#00cec9', category: 'electronic', drumPattern: 'breakbeat', intensity: 'high' },
  { id: ' halftime', name: 'Halftime', bpm: 170, baseScale: [0, 3, 5, 7, 10], description: 'Feel de 85 BPM', color: '#a29bfe', category: 'electronic', drumPattern: 'half-time', intensity: 'high' },
  
  // Urban Music
  { id: 'hiphop', name: 'Hip Hop', bpm: 95, baseScale: [0, 2, 3, 5, 7, 9, 10], description: 'Groove e sample-based', color: '#ff006e', category: 'urban', drumPattern: 'breakbeat', intensity: 'medium' },
  { id: 'boom-bap', name: 'Boom Bap', bpm: 90, baseScale: [0, 2, 3, 5, 7, 8, 10], description: 'Old school e soulful', color: '#fdcb6e', category: 'urban', drumPattern: 'breakbeat', intensity: 'medium' },
  { id: 'trap', name: 'Trap', bpm: 140, baseScale: [0, 3, 5, 6, 7, 10], description: 'Hi-hats rápidos e 808', color: '#8338ec', category: 'urban', drumPattern: 'syncopated', intensity: 'high' },
  { id: 'drill', name: 'Drill', bpm: 140, baseScale: [0, 3, 5, 6, 7, 8, 10], description: 'Dark e agressivo', color: '#2d3436', category: 'urban', drumPattern: 'syncopated', intensity: 'high' },
  { id: 'phonk', name: 'Phonk', bpm: 140, baseScale: [0, 3, 5, 6, 7, 10], description: 'Memphis samples e cowbell', color: '#636e72', category: 'urban', drumPattern: 'syncopated', intensity: 'medium' },
  { id: 'afrobeat', name: 'Afrobeat', bpm: 120, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Polirrítmico e dance', color: '#00b894', category: 'urban', drumPattern: 'syncopated', intensity: 'medium' },
  
  // Chill/Atmospheric
  { id: 'lofi', name: 'Lo-Fi', bpm: 85, baseScale: [0, 3, 5, 7, 10], description: 'Relaxado e jazzy', color: '#ffd700', category: 'organic', drumPattern: 'sparse', intensity: 'low' },
  { id: 'ambient', name: 'Ambient', bpm: 60, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Texturas etéreas', color: '#74b9ff', category: 'organic', drumPattern: 'sparse', intensity: 'low' },
  { id: 'downtempo', name: 'Downtempo', bpm: 90, baseScale: [0, 2, 3, 5, 7, 8, 10], description: 'Relaxado e melódico', color: '#a29bfe', category: 'organic', drumPattern: 'sparse', intensity: 'low' },
  { id: 'trip-hop', name: 'Trip Hop', bpm: 90, baseScale: [0, 2, 3, 5, 7, 8, 10], description: 'Dark e atmosférico', color: '#2d3436', category: 'organic', drumPattern: 'breakbeat', intensity: 'medium' },
  { id: 'chillwave', name: 'Chillwave', bpm: 100, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Nostálgico e dreamy', color: '#fd79a8', category: 'organic', drumPattern: 'sparse', intensity: 'low' },
  
  // Experimental
  { id: 'idm', name: 'IDM', bpm: 120, baseScale: [0, 2, 4, 6, 8, 10], description: 'Complexo e cerebral', color: '#00cec9', category: 'experimental', drumPattern: 'syncopated', intensity: 'medium' },
  { id: 'glitch', name: 'Glitch', bpm: 130, baseScale: [0, 1, 4, 5, 7, 8, 11], description: 'Cortes e erros digitais', color: '#e17055', category: 'experimental', drumPattern: 'syncopated', intensity: 'high' },
  { id: 'noise', name: 'Noise', bpm: 140, baseScale: [0, 1, 3, 6, 8, 10], description: 'Textura abrasiva', color: '#2d3436', category: 'experimental', drumPattern: 'sparse', intensity: 'extreme' },
  { id: 'deconstructed-club', name: 'Deconstructed Club', bpm: 150, baseScale: [0, 1, 3, 5, 7, 8, 10], description: 'Club music fragmentada', color: '#6c5ce7', category: 'experimental', drumPattern: 'syncopated', intensity: 'extreme' },
  
  // Synthwave/Retro
  { id: 'synthwave', name: 'Synthwave', bpm: 120, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Anos 80 retrô', color: '#fd79a8', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'medium' },
  { id: 'vaporwave', name: 'Vaporwave', bpm: 100, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Lenta e nostálgica', color: '#a29bfe', category: 'electronic', drumPattern: 'sparse', intensity: 'low' },
  { id: 'dark-synth', name: 'Dark Synth', bpm: 130, baseScale: [0, 2, 3, 5, 7, 8, 10], description: 'Cinemática e sombria', color: '#2d3436', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'high' },
  
  // Pop/Mainstream EDM
  { id: 'edm', name: 'EDM', bpm: 130, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Festival e energético', color: '#00d4ff', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'high' },
  { id: 'electro-pop', name: 'Electro Pop', bpm: 128, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Melódico e radio-friendly', color: '#fdcb6e', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'medium' },
  { id: 'future-bass', name: 'Future Bass', bpm: 150, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Chords ricos e vocal chops', color: '#00cec9', category: 'electronic', drumPattern: 'syncopated', intensity: 'high' },
  { id: 'tropical-house', name: 'Tropical House', bpm: 120, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Leve e veraneio', color: '#00b894', category: 'electronic', drumPattern: 'four-on-floor', intensity: 'medium' },
  
  // Gêneros clássicos
  { id: 'disco', name: 'Disco', bpm: 120, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Groove dos anos 70', color: '#fdcb6e', category: 'classic', drumPattern: 'four-on-floor', intensity: 'medium' },
  { id: 'funk', name: 'Funk', bpm: 110, baseScale: [0, 2, 3, 5, 6, 7, 9, 10], description: 'Groove e slap bass', color: '#e17055', category: 'classic', drumPattern: 'syncopated', intensity: 'medium' },
  { id: 'soul', name: 'Soul', bpm: 100, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Emocional e suave', color: '#fd79a8', category: 'classic', drumPattern: 'breakbeat', intensity: 'low' },
  { id: 'jazz', name: 'Jazz', bpm: 140, baseScale: [0, 2, 4, 6, 7, 9, 10, 11], description: 'Improvisação e swing', color: '#74b9ff', category: 'classic', drumPattern: 'syncopated', intensity: 'medium' },
  { id: 'bossa-nova', name: 'Bossa Nova', bpm: 120, baseScale: [0, 2, 3, 5, 7, 9, 10], description: 'Brasileira e suave', color: '#00b894', category: 'classic', drumPattern: 'syncopated', intensity: 'low' },
];

// Sons de percussão expandidos - parâmetros otimizados para síntese Web Audio
export const PERCUSSION_SOUNDS = {
  kick: { name: 'Kick', frequency: 60, decay: 0.4, type: 'sine' as OscillatorType, noise: 0, pitchDecay: 0.08, noiseFilter: 0 },
  snare: { name: 'Snare', frequency: 180, decay: 0.15, type: 'triangle' as OscillatorType, noise: 0.65, pitchDecay: 0, noiseFilter: 4000 },
  hihat: { name: 'Hi-Hat', frequency: 8000, decay: 0.06, type: 'square' as OscillatorType, noise: 0.85, pitchDecay: 0, noiseFilter: 7000 },
  clap: { name: 'Clap', frequency: 1200, decay: 0.12, type: 'sawtooth' as OscillatorType, noise: 0.9, pitchDecay: 0, noiseFilter: 3000 },
  rim: { name: 'Rimshot', frequency: 1800, decay: 0.04, type: 'square' as OscillatorType, noise: 0.15, pitchDecay: 0, noiseFilter: 5000 },
  tom: { name: 'Tom', frequency: 100, decay: 0.3, type: 'sine' as OscillatorType, noise: 0, pitchDecay: 0.12, noiseFilter: 0 },
  conga: { name: 'Conga', frequency: 250, decay: 0.15, type: 'sine' as OscillatorType, noise: 0.05, pitchDecay: 0.06, noiseFilter: 0 },
  bongo: { name: 'Bongo', frequency: 400, decay: 0.1, type: 'sine' as OscillatorType, noise: 0.08, pitchDecay: 0.04, noiseFilter: 0 },
  tambourine: { name: 'Tambourine', frequency: 6000, decay: 0.12, type: 'triangle' as OscillatorType, noise: 0.7, pitchDecay: 0, noiseFilter: 5500 },
  shaker: { name: 'Shaker', frequency: 5000, decay: 0.04, type: 'square' as OscillatorType, noise: 0.8, pitchDecay: 0, noiseFilter: 4500 },
  crash: { name: 'Crash', frequency: 4000, decay: 1.2, type: 'sawtooth' as OscillatorType, noise: 0.85, pitchDecay: 0, noiseFilter: 6000 },
  ride: { name: 'Ride', frequency: 3500, decay: 0.5, type: 'triangle' as OscillatorType, noise: 0.5, pitchDecay: 0, noiseFilter: 5000 },
  cowbell: { name: 'Cowbell', frequency: 560, decay: 0.15, type: 'square' as OscillatorType, noise: 0.05, pitchDecay: 0, noiseFilter: 3000 },
  woodblock: { name: 'Woodblock', frequency: 1200, decay: 0.03, type: 'square' as OscillatorType, noise: 0.02, pitchDecay: 0, noiseFilter: 4000 },
  triangle: { name: 'Triangle', frequency: 2500, decay: 0.6, type: 'sine' as OscillatorType, noise: 0.05, pitchDecay: 0, noiseFilter: 6000 },
  guiro: { name: 'Guiro', frequency: 3000, decay: 0.08, type: 'sawtooth' as OscillatorType, noise: 0.5, pitchDecay: 0, noiseFilter: 3500 },
  cabasa: { name: 'Cabasa', frequency: 5500, decay: 0.04, type: 'square' as OscillatorType, noise: 0.75, pitchDecay: 0, noiseFilter: 5000 },
  openhat: { name: 'Open Hat', frequency: 7500, decay: 0.25, type: 'square' as OscillatorType, noise: 0.8, pitchDecay: 0, noiseFilter: 6500 },
  pedalhat: { name: 'Pedal Hat', frequency: 7000, decay: 0.06, type: 'square' as OscillatorType, noise: 0.7, pitchDecay: 0, noiseFilter: 6000 },
  snap: { name: 'Snap', frequency: 2500, decay: 0.02, type: 'triangle' as OscillatorType, noise: 0.2, pitchDecay: 0, noiseFilter: 4000 },
  stomp: { name: 'Stomp', frequency: 50, decay: 0.25, type: 'sine' as OscillatorType, noise: 0.05, pitchDecay: 0.1, noiseFilter: 0 },
};

// Frequências de notas
export const KEY_FREQUENCIES: Record<string, number> = {
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00,
};

// Tracks padrão com volumes balanceados
export const DEFAULT_TRACKS: Omit<Track, 'id' | 'pattern'>[] = [
  // Melodia
  { name: 'Melodia', muted: false, volume: 0.65, pan: 0, type: 'melody', synthParams: DEFAULT_SYNTH_PARAMS.melody, effects: DEFAULT_TRACK_EFFECTS.melody },
  { name: 'Lead', muted: false, volume: 0.6, pan: 0.15, type: 'lead', synthParams: DEFAULT_SYNTH_PARAMS.lead, effects: DEFAULT_TRACK_EFFECTS.lead },
  { name: 'Arp', muted: false, volume: 0.5, pan: -0.2, type: 'arp', synthParams: DEFAULT_SYNTH_PARAMS.arp, effects: DEFAULT_TRACK_EFFECTS.arp },
  { name: 'Guitarra', muted: false, volume: 0.6, pan: 0.2, type: 'pluck', synthParams: DEFAULT_SYNTH_PARAMS.pluck, effects: DEFAULT_TRACK_EFFECTS.pluck },
  
  // Bass
  { name: 'Baixo', muted: false, volume: 0.75, pan: 0, type: 'bass', synthParams: DEFAULT_SYNTH_PARAMS.bass, effects: DEFAULT_TRACK_EFFECTS.bass },
  { name: 'Sub', muted: false, volume: 0.8, pan: 0, type: 'sub', synthParams: DEFAULT_SYNTH_PARAMS.sub, effects: DEFAULT_TRACK_EFFECTS.sub },
  
  // Harmonia
  { name: 'Pad', muted: false, volume: 0.45, pan: -0.3, type: 'pad', synthParams: DEFAULT_SYNTH_PARAMS.pad, effects: DEFAULT_TRACK_EFFECTS.pad },
  { name: 'Drone', muted: true, volume: 0.4, pan: 0, type: 'drone', synthParams: DEFAULT_SYNTH_PARAMS.drone, effects: DEFAULT_TRACK_EFFECTS.drone },
  
  // Percussão
  { name: 'Percussão', muted: false, volume: 0.7, pan: 0, type: 'percussion', synthParams: DEFAULT_SYNTH_PARAMS.percussion, effects: DEFAULT_TRACK_EFFECTS.percussion },
  { name: 'FX', muted: true, volume: 0.4, pan: 0.3, type: 'effect', synthParams: DEFAULT_SYNTH_PARAMS.effect, effects: DEFAULT_TRACK_EFFECTS.effect },
];

// Categorias de estilos
export const STYLE_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'electronic', name: 'Eletrônica' },
  { id: 'urban', name: 'Urbano' },
  { id: 'organic', name: 'Orgânico' },
  { id: 'experimental', name: 'Experimental' },
  { id: 'classic', name: 'Clássicos' },
];

// Intensidades
export const INTENSITIES = [
  { id: 'low', name: 'Leve', color: '#00b894' },
  { id: 'medium', name: 'Médio', color: '#fdcb6e' },
  { id: 'high', name: 'Intenso', color: '#e17055' },
  { id: 'extreme', name: 'Extremo', color: '#d63031' },
];
