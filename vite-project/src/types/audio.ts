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
};

export interface PatternStep {
  note: string | null;
  velocity: number;
}

export interface Track {
  id: string;
  name: string;
  pattern: PatternStep[];
  muted: boolean;
  volume: number;
  pan: number;
  type: 'melody' | 'bass' | 'percussion' | 'effect';
}

export interface Project {
  name: string;
  bpm: number;
  key: string;
  scale: string;
  style: string;
  tracks: Track[];
}

export const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const OCTAVES: Octave[] = [1, 2, 3, 4, 5, 6, 7];

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
};

export const MUSIC_STYLES: MusicStyle[] = [
  { id: 'house', name: 'House', bpm: 128, baseScale: [0, 2, 4, 5, 7, 9, 11], description: '4/4 com kick forte', color: '#e94560' },
  { id: 'techno', name: 'Techno', bpm: 135, baseScale: [0, 3, 5, 7, 10], description: 'Industrial e repetitivo', color: '#00ff88' },
  { id: 'trance', name: 'Trance', bpm: 140, baseScale: [0, 2, 4, 6, 7, 9, 11], description: 'Melódico e progressivo', color: '#9d4edd' },
  { id: 'dubstep', name: 'Dubstep', bpm: 140, baseScale: [0, 3, 5, 7, 10], description: 'Wobble bass e syncopado', color: '#ff6b35' },
  { id: 'lofi', name: 'Lo-Fi', bpm: 85, baseScale: [0, 3, 5, 7, 10], description: 'Relaxado e jazzy', color: '#ffd700' },
  { id: 'edm', name: 'EDM', bpm: 130, baseScale: [0, 2, 4, 5, 7, 9, 11], description: 'Festival e energético', color: '#00d4ff' },
  { id: 'hiphop', name: 'Hip Hop', bpm: 95, baseScale: [0, 2, 3, 5, 7, 9, 10], description: 'Groove e sample-based', color: '#ff006e' },
  { id: 'trap', name: 'Trap', bpm: 140, baseScale: [0, 3, 5, 6, 7, 10], description: 'Hi-hats rápidos e 808', color: '#8338ec' },
];

export const KEY_FREQUENCIES: Record<string, number> = {
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00,
};

export const DEFAULT_TRACKS: Omit<Track, 'id' | 'pattern'>[] = [
  { name: 'Melodia', muted: false, volume: 0.8, pan: 0, type: 'melody' },
  { name: 'Baixo', muted: false, volume: 0.9, pan: 0, type: 'bass' },
  { name: 'Percussão', muted: false, volume: 0.7, pan: 0, type: 'percussion' },
  { name: 'Efeitos', muted: false, volume: 0.6, pan: 0, type: 'effect' },
];
