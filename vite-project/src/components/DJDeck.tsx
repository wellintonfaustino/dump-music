import { useState, useEffect } from 'react';
import { NOTES, SCALES, MUSIC_STYLES, PERCUSSION_SOUNDS, MAX_STEPS, STYLE_CATEGORIES, INTENSITIES } from '../types/audio.ts';
import { audioEngine } from '../hooks/useAudio.ts';
import Sequencer from './Sequencer.tsx';
import Visualizer from './Visualizer.tsx';

// Icons para instrumentos
const TRACK_ICONS: Record<string, string> = {
  melody: '🎵', lead: '🎸', pluck: '💫', arp: '🎹',
  bass: '🔊', sub: '📢', pad: '🌊', drone: '🌀',
  percussion: '🥁', effect: '✨',
};

export default function DJDeck() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [masterVolume, setMasterVolume] = useState(70);
  const [selectedStyle, setSelectedStyle] = useState(MUSIC_STYLES[0]);
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedScale, setSelectedScale] = useState('major');
  const [tracks, setTracks] = useState(audioEngine.getTracks());
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCount, setStepCount] = useState(MAX_STEPS);
  const [styleCategory, setStyleCategory] = useState('all');
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedPercussion, setSelectedPercussion] = useState('kick');

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

  const handleStepCountChange = (count: number) => {
    const newCount = Math.max(16, Math.min(MAX_STEPS, count));
    setStepCount(newCount);
    audioEngine.setStepCount(newCount);
  };

  const handleAutoGenerate = () => {
    audioEngine.autoGenerate();
  };

  const clearAllPatterns = () => {
    tracks.forEach(track => {
      const emptyPattern = Array(stepCount).fill(null).map(() => ({ note: null, velocity: 0 }));
      audioEngine.setTrackPattern(track.id, emptyPattern);
    });
  };

  const toggleTrackMute = (trackId: string) => {
    audioEngine.toggleTrackMute(trackId);
    setTracks([...audioEngine.getTracks()]);
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    audioEngine.setTrackVolume(trackId, volume);
    setTracks([...audioEngine.getTracks()]);
  };

  const setTrackPan = (trackId: string, pan: number) => {
    audioEngine.setTrackPan(trackId, pan);
    setTracks([...audioEngine.getTracks()]);
  };

  const handleStepClick = (trackId: string, stepIndex: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newPattern = [...track.pattern];
    const currentStepData = newPattern[stepIndex];

    if (track.type === 'percussion') {
      newPattern[stepIndex] = {
        note: currentStepData.note === null ? selectedPercussion : null,
        velocity: 0.8,
      };
    } else {
      const scale = SCALES[selectedScale].notes;
      const baseNoteIndex = NOTES.indexOf(selectedKey as any);
      const currentNote = currentStepData.note;
      
      if (currentNote) {
        newPattern[stepIndex] = { note: null, velocity: 0 };
      } else {
        const randomInterval = scale[Math.floor(Math.random() * scale.length)];
        const noteIndex = (baseNoteIndex + randomInterval) % 12;
        const octave = track.type === 'bass' || track.type === 'sub' ? 2 : 
                      track.type === 'lead' ? 5 : 4;
        const note = NOTES[noteIndex] + octave;
        
        newPattern[stepIndex] = { 
          note, 
          velocity: 0.7 + Math.random() * 0.3,
          duration: track.type === 'pad' || track.type === 'drone' ? 4.0 : 0.5,
        };
      }
    }

    audioEngine.setTrackPattern(trackId, newPattern);
  };

  const filteredStyles = styleCategory === 'all' 
    ? MUSIC_STYLES 
    : MUSIC_STYLES.filter(s => s.category === styleCategory);

  const selectedTrackData = selectedTrack ? tracks.find(t => t.id === selectedTrack) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-deck-accent to-pink-500 flex items-center justify-center text-2xl animate-pulse">
            🎧
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              DUMP REMIX <span className="text-deck-accent">STUDIO</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {stepCount} Steps • {selectedStyle.name} • {selectedKey} {SCALES[selectedScale].name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-black/40 rounded-lg px-4 py-2 border border-white/10">
            <span className="text-gray-400 text-xs uppercase">BPM</span>
            <div className="text-2xl font-mono font-bold text-deck-accent">{bpm}</div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePlay}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                isPlaying 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>
            <button 
              onClick={handleStop} 
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors"
            >
              ⏹ STOP
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Left Panel */}
        <div className="col-span-3 space-y-4">
          {/* Style Selection */}
          <div className="bg-deck-panel/80 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-deck-accent font-bold uppercase text-sm">Estilos ({MUSIC_STYLES.length})</h3>
              <select 
                value={styleCategory}
                onChange={(e) => setStyleCategory(e.target.value)}
                className="text-xs bg-black/30 text-white rounded px-2 py-1 border border-white/20"
              >
                {STYLE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto">
              {filteredStyles.map(style => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`p-2 rounded text-xs font-semibold transition-all text-left ${
                    selectedStyle.id === style.id
                      ? 'bg-deck-accent text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div>{style.name}</div>
                  <div className="text-[9px] opacity-70">{style.bpm} BPM • {style.intensity}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Key & Scale */}
          <div className="bg-deck-panel/80 rounded-xl p-4 border border-white/10">
            <h3 className="text-deck-accent font-bold mb-3 uppercase text-sm">Harmonia</h3>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select
                value={selectedKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="bg-black/30 text-white p-2 rounded text-sm border border-white/20"
              >
                {NOTES.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
              <select
                value={selectedScale}
                onChange={(e) => handleScaleChange(e.target.value)}
                className="bg-black/30 text-white p-2 rounded text-sm border border-white/20"
              >
                {Object.entries(SCALES).map(([id, scale]) => (
                  <option key={id} value={id}>{scale.name}</option>
                ))}
              </select>
            </div>

            {/* Step Count */}
            <div className="mb-3">
              <label className="text-gray-400 text-xs uppercase flex justify-between">
                <span>Steps</span>
                <span className="text-deck-accent">{stepCount}</span>
              </label>
              <input
                type="range"
                min="16"
                max={MAX_STEPS}
                step="4"
                value={stepCount}
                onChange={(e) => handleStepCountChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>16</span>
                <span>60</span>
                <span>120</span>
              </div>
            </div>
          </div>

          {/* Auto Generate */}
          <div className="bg-deck-panel/80 rounded-xl p-4 border border-white/10">
            <h3 className="text-deck-accent font-bold mb-3 uppercase text-sm">Geração</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAutoGenerate}
                className="bg-gradient-to-r from-deck-accent to-pink-500 text-white py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
              >
                🤖 Auto
              </button>
              <button
                onClick={clearAllPatterns}
                className="bg-white/10 text-white py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors"
              >
                🗑️ Clear
              </button>
            </div>
            
            {/* Percussion selector */}
            <div className="mt-3">
              <label className="text-gray-400 text-xs uppercase block mb-1">Percussão</label>
              <select
                value={selectedPercussion}
                onChange={(e) => setSelectedPercussion(e.target.value)}
                className="w-full bg-black/30 text-white p-2 rounded text-sm border border-white/20"
              >
                {Object.entries(PERCUSSION_SOUNDS).map(([key, sound]) => (
                  <option key={key} value={key}>{sound.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center - Sequencer */}
        <div className="col-span-6">
          <Sequencer
            tracks={tracks}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            stepCount={stepCount}
          />
        </div>

        {/* Right Panel */}
        <div className="col-span-3 space-y-4">
          {/* Master Controls */}
          <div className="bg-deck-panel/80 rounded-xl p-4 border border-white/10">
            <h3 className="text-deck-accent font-bold mb-4 uppercase text-sm">Master</h3>
            
            <div className="mb-4">
              <label className="text-gray-400 text-xs uppercase block mb-2">Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-gray-500 text-xs mt-1">
                <span>0%</span>
                <span className="text-deck-accent font-bold">{masterVolume}%</span>
              </div>
            </div>

            <Visualizer />
          </div>

          {/* Track Details */}
          <div className="bg-deck-panel/80 rounded-xl p-4 border border-white/10">
            <h3 className="text-deck-accent font-bold mb-3 uppercase text-sm">Tracks ({tracks.length})</h3>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {tracks.map((track) => (
                <div 
                  key={track.id}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    selectedTrack === track.id 
                      ? 'bg-white/10 border-deck-accent' 
                      : 'bg-black/20 border-white/5 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedTrack(track.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{TRACK_ICONS[track.type]}</span>
                      <span className="text-white text-sm font-medium">{track.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTrackMute(track.id);
                      }}
                      className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                        track.muted ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    >
                      {track.muted ? 'M' : 'S'}
                    </button>
                  </div>
                  
                  {/* Track mini controls */}
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={track.volume * 100}
                      onChange={(e) => {
                        e.stopPropagation();
                        setTrackVolume(track.id, Number(e.target.value) / 100);
                      }}
                      className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer"
                    />
                    <span className="text-gray-400 text-xs w-8">{Math.round(track.volume * 100)}%</span>
                  </div>
                  
                  {/* Pan */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-gray-500 text-[10px]">L</span>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={track.pan * 100}
                      onChange={(e) => {
                        e.stopPropagation();
                        setTrackPan(track.id, Number(e.target.value) / 100);
                      }}
                      className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer"
                    />
                    <span className="text-gray-500 text-[10px]">R</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Track Settings */}
          {selectedTrackData && (
            <div className="bg-deck-panel/80 rounded-xl p-4 border border-white/10">
              <h3 className="text-deck-accent font-bold mb-3 uppercase text-sm">
                {TRACK_ICONS[selectedTrackData.type]} {selectedTrackData.name} Settings
              </h3>
              
              {selectedTrackData.synthParams && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Waveform</span>
                    <span className="text-white">{selectedTrackData.synthParams.waveform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Filter Cutoff</span>
                    <span className="text-white">{selectedTrackData.synthParams.filterCutoff}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unison</span>
                    <span className="text-white">{selectedTrackData.synthParams.unison}</span>
                  </div>
                </div>
              )}
              
              {selectedTrackData.effects && (
                <div className="mt-3 space-y-2">
                  <div className="text-gray-400 text-xs uppercase">Efeitos</div>
                  {Object.entries(selectedTrackData.effects).map(([effect, value]) => (
                    <div key={effect} className="flex items-center gap-2">
                      <span className="text-gray-500 text-[10px] capitalize w-16">{effect}</span>
                      <div className="flex-1 h-1 bg-gray-700 rounded overflow-hidden">
                        <div 
                          className="h-full bg-deck-accent"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 bg-deck-panel/40 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: selectedStyle.color }}
            />
            <div>
              <span className="text-gray-400 text-sm">Estilo:</span>
              <span className="text-white font-bold ml-2">{selectedStyle.name}</span>
              <span className="text-gray-500 text-sm ml-2">{selectedStyle.description}</span>
            </div>
            
            <div className="h-6 w-px bg-white/20" />
            
            <div className="flex items-center gap-2">
              {INTENSITIES.find(i => i.id === selectedStyle.intensity) && (
                <>
                  <span className="text-gray-400 text-xs uppercase">Intensidade:</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ 
                      backgroundColor: INTENSITIES.find(i => i.id === selectedStyle.intensity)?.color + '40',
                      color: INTENSITIES.find(i => i.id === selectedStyle.intensity)?.color 
                    }}
                  >
                    {INTENSITIES.find(i => i.id === selectedStyle.intensity)?.name}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs uppercase">Pattern:</span>
              <span className="text-xs text-white/80 capitalize">{selectedStyle.drumPattern.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>🎹 {tracks.filter(t => t.type === 'melody' || t.type === 'lead').length} Melódicos</span>
            <span>🔊 {tracks.filter(t => t.type === 'bass' || t.type === 'sub').length} Bass</span>
            <span>🥁 {tracks.filter(t => t.type === 'percussion').length} Percussão</span>
          </div>
        </div>
      </div>
    </div>
  );
}
