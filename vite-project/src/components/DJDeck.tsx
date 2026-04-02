import { useState, useEffect, useRef, useCallback } from 'react';
import { NOTES, OCTAVES, SCALES, MUSIC_STYLES, KEY_FREQUENCIES } from '../types/audio.ts';
import { audioEngine } from '../hooks/useAudio.ts';
import Knob from './Knob';
import Fader from './Fader';
import Sequencer from './Sequencer';
import Visualizer from './Visualizer';

export default function DJDeck() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [masterVolume, setMasterVolume] = useState(70);
  const [selectedStyle, setSelectedStyle] = useState(MUSIC_STYLES[0]);
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedScale, setSelectedScale] = useState('major');
  const [tracks, setTracks] = useState(audioEngine.getTracks());
  const [currentStep, setCurrentStep] = useState(0);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string[]>([]);

  useEffect(() => {
    audioEngine.setBPM(bpm);
  }, [bpm]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTracks([...audioEngine.getTracks()]);
      setCurrentStep(audioEngine.getCurrentStep());
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handlePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

  const handleStyleChange = (styleId: string) => {
    const style = MUSIC_STYLES.find(s => s.id === styleId);
    if (style) {
      setSelectedStyle(style);
      setBpm(style.bpm);
      audioEngine.setStyle(style);
    }
  };

  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
    audioEngine.setKey(key);
  };

  const handleScaleChange = (scaleId: string) => {
    setSelectedScale(scaleId);
    audioEngine.setScale(SCALES[scaleId]);
  };

  const handleAutoGenerate = () => {
    audioEngine.autoGenerate();
    setShowGenerator(true);
  };

  const handleGenerateMelody = () => {
    const melodyPattern = audioEngine.generateMelodyPattern();
    audioEngine.setTrackPattern(tracks[0].id, melodyPattern);
  };

  const toggleTrackMute = (trackId: string) => {
    audioEngine.toggleTrackMute(trackId);
    setTracks([...audioEngine.getTracks()]);
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    audioEngine.setTrackVolume(trackId, volume);
  };

  const handleStepClick = (trackId: string, stepIndex: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newPattern = [...track.pattern];
    const currentStep = newPattern[stepIndex];

    if (track.type === 'percussion') {
      const percussionTypes = ['kick', 'snare', 'hihat'];
      const currentType = percussionTypes.indexOf(currentStep.note || '');
      const nextType = percussionTypes[(currentType + 1) % percussionTypes.length];
      
      newPattern[stepIndex] = {
        note: currentStep.note === null ? nextType : null,
        velocity: 0.8,
      };
    } else {
      const scale = SCALES[selectedScale].notes;
      const baseNoteIndex = NOTES.indexOf(selectedKey as any);
      const currentNote = currentStep.note;
      
      if (currentNote) {
        newPattern[stepIndex] = { note: null, velocity: 0 };
      } else {
        const randomInterval = scale[Math.floor(Math.random() * scale.length)];
        const noteIndex = (baseNoteIndex + randomInterval) % 12;
        const octave = 4 + Math.floor(Math.random() * 2);
        const note = NOTES[noteIndex] + octave;
        
        newPattern[stepIndex] = { note, velocity: 0.7 + Math.random() * 0.3 };
      }
    }

    audioEngine.setTrackPattern(trackId, newPattern);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="vinyl spinning" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              DUMP REMIX <span className="text-deck-accent">STUDIO</span>
            </h1>
            <p className="text-gray-400 text-sm">Geração de Melodias Profissional</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="led-display text-xl">
            BPM: {bpm}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePlay}
              className={`btn-pad ${isPlaying ? 'active' : ''}`}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button onClick={handleStop} className="btn-pad">
              STOP
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Left Panel - Style & Key */}
        <div className="col-span-3 bg-deck-panel/80 rounded-xl p-6 border border-white/10">
          <h3 className="text-deck-accent font-bold mb-4 uppercase tracking-wider text-sm">Estilo Musical</h3>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {MUSIC_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedStyle.id === style.id
                    ? 'bg-deck-accent text-white shadow-lg shadow-deck-accent/50'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>

          <h3 className="text-deck-accent font-bold mb-4 uppercase tracking-wider text-sm">Tom & Escala</h3>
          <div className="flex gap-3 mb-4">
            <select
              value={selectedKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="flex-1 bg-black/30 text-white p-3 rounded-lg border border-white/20"
            >
              {NOTES.map(note => (
                <option key={note} value={note}>{note}</option>
              ))}
            </select>
            <select
              value={selectedScale}
              onChange={(e) => handleScaleChange(e.target.value)}
              className="flex-1 bg-black/30 text-white p-3 rounded-lg border border-white/20"
            >
              {Object.entries(SCALES).map(([id, scale]) => (
                <option key={id} value={id}>{scale.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAutoGenerate}
            className="w-full bg-gradient-to-r from-deck-accent to-pink-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            AUTO GERAR
          </button>
        </div>

        {/* Center - Sequencer */}
        <div className="col-span-6">
          <Sequencer
            tracks={tracks}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Right Panel - Master Controls */}
        <div className="col-span-3 bg-deck-panel/80 rounded-xl p-6 border border-white/10">
          <h3 className="text-deck-accent font-bold mb-6 uppercase tracking-wider text-sm">Master</h3>
          
          <div className="flex justify-center mb-8">
            <Fader
              value={masterVolume}
              onChange={setMasterVolume}
              label="MASTER"
              color="text-deck-accent"
            />
          </div>

          <div className="mb-6">
            <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">BPM</label>
            <input
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-deck-accent"
            />
            <div className="flex justify-between text-gray-500 text-xs mt-1">
              <span>60</span>
              <span className="text-deck-accent font-bold">{bpm}</span>
              <span>200</span>
            </div>
          </div>

          <Visualizer />
        </div>
      </div>

      {/* Track Controls */}
      <div className="grid grid-cols-4 gap-4">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="bg-deck-panel/60 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-bold">{track.name}</h4>
              <button
                onClick={() => toggleTrackMute(track.id)}
                className={`w-8 h-8 rounded ${track.muted ? 'bg-red-500' : 'bg-green-500'} text-white text-xs font-bold`}
              >
                {track.muted ? 'M' : 'S'}
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-gray-500 text-xs uppercase block mb-1">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={track.volume * 100}
                  onChange={(e) => setTrackVolume(track.id, Number(e.target.value) / 100)}
                  className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-deck-accent"
                />
              </div>
              <div className="w-10">
                <span className="text-gray-400 text-xs">{Math.round(track.volume * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Style Info */}
      <div className="mt-6 bg-deck-panel/40 rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-4">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: selectedStyle.color }}
          />
          <div>
            <span className="text-gray-400 text-sm">Estilo Selecionado:</span>
            <span className="text-white font-bold ml-2">{selectedStyle.name}</span>
            <span className="text-gray-500 text-sm ml-2">- {selectedStyle.description}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
