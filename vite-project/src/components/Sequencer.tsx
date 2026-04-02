import { MAX_STEPS } from '../types/audio.ts';
import type { Track, TrackType } from '../types/audio.ts';
import { useState, useRef, useEffect } from 'react';

interface SequencerProps {
  tracks: Track[];
  currentStep: number;
  onStepClick: (trackId: string, stepIndex: number) => void;
  stepCount?: number;
}

const TRACK_COLORS: Record<TrackType, string> = {
  melody: 'bg-blue-500',
  lead: 'bg-cyan-500',
  pluck: 'bg-sky-500',
  arp: 'bg-indigo-500',
  bass: 'bg-purple-500',
  sub: 'bg-violet-600',
  pad: 'bg-teal-500',
  drone: 'bg-emerald-600',
  percussion: 'bg-orange-500',
  effect: 'bg-pink-500',
};

const TRACK_ICONS: Record<TrackType, string> = {
  melody: '🎵',
  lead: '🎸',
  pluck: '💫',
  arp: '🎹',
  bass: '🔊',
  sub: '📢',
  pad: '🌊',
  drone: '🌀',
  percussion: '🥁',
  effect: '✨',
};

export default function Sequencer({ tracks, currentStep, onStepClick, stepCount = MAX_STEPS }: SequencerProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 32 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const sequencerRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Atualizar visibilidade baseada no passo atual
  useEffect(() => {
    const stepsPerView = Math.floor(32 / zoomLevel);
    if (currentStep >= visibleRange.end - 4) {
      const newStart = Math.min(currentStep - 8, stepCount - stepsPerView);
      const newEnd = Math.min(newStart + stepsPerView, stepCount);
      setVisibleRange({ start: Math.max(0, newStart), end: newEnd });
    }
  }, [currentStep, stepCount, zoomLevel]);

  const handleScroll = (direction: 'left' | 'right') => {
    const stepsPerView = Math.floor(32 / zoomLevel);
    const stepSize = Math.floor(stepsPerView / 2);
    
    if (direction === 'left') {
      const newStart = Math.max(0, visibleRange.start - stepSize);
      setVisibleRange({ start: newStart, end: Math.min(newStart + stepsPerView, stepCount) });
    } else {
      const newStart = Math.min(visibleRange.start + stepSize, stepCount - stepsPerView);
      setVisibleRange({ start: newStart, end: Math.min(newStart + stepsPerView, stepCount) });
    }
  };

  const handleZoom = (newZoom: number) => {
    setZoomLevel(newZoom);
    const stepsPerView = Math.floor(32 / newZoom);
    setVisibleRange({
      start: visibleRange.start,
      end: Math.min(visibleRange.start + stepsPerView, stepCount)
    });
  };

  const visibleSteps = stepCount;
  const stepsPerBeat = 4;
  const stepsPerBar = 16;
  const totalBars = Math.ceil(stepCount / stepsPerBar);

  return (
    <div className="bg-deck-panel/80 rounded-xl p-4 border border-white/10">
      {/* Header com controles */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-deck-accent font-bold uppercase tracking-wider text-sm">
            Sequenciador
          </h3>
          <span className="text-gray-500 text-xs">
            {stepCount} steps • {totalBars} bars
          </span>
        </div>
        
        {/* Controles de navegação */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleScroll('left')}
            disabled={visibleRange.start === 0}
            className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
          >
            ←
          </button>
          
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
            {[0.5, 1, 2].map((zoom) => (
              <button
                key={zoom}
                onClick={() => handleZoom(zoom)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  zoomLevel === zoom ? 'bg-deck-accent text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {zoom}x
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handleScroll('right')}
            disabled={visibleRange.end >= stepCount}
            className="px-2 py-1 bg-white/10 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
          >
            →
          </button>
        </div>
        
        {/* Legenda de cores */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(TRACK_COLORS).slice(0, 6).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded ${color}`}></div>
              <span className="text-gray-400 text-[10px] capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline com marcas de compassos */}
      <div className="mb-2 flex items-center gap-1 ml-28">
        {Array.from({ length: Math.min(visibleSteps, visibleRange.end - visibleRange.start) }).map((_, i) => {
          const actualStep = visibleRange.start + i;
          const isBarStart = actualStep % stepsPerBar === 0;
          const isBeatStart = actualStep % stepsPerBeat === 0;
          const barNumber = Math.floor(actualStep / stepsPerBar) + 1;
          
          return (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center ${isBarStart ? 'border-l border-deck-accent/50' : ''}`}
              style={{ minWidth: `${zoomLevel * 20}px` }}
            >
              {isBarStart && (
                <span className="text-[8px] text-deck-accent">{barNumber}</span>
              )}
              <div
                className={`w-full h-0.5 ${
                  isBarStart ? 'bg-deck-accent' : isBeatStart ? 'bg-white/30' : 'bg-white/10'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Sequenciador */}
      <div ref={sequencerRef} className="space-y-1 max-h-[400px] overflow-y-auto">
        {tracks.map((track, trackIndex) => (
          <div
            key={track.id}
            ref={el => { trackRefs.current[trackIndex] = el; }}
            className="flex items-center gap-2 py-0.5"
          >
            {/* Info da track */}
            <div className="w-28 flex items-center gap-1 shrink-0">
              <span className="text-lg" title={track.type}>{TRACK_ICONS[track.type]}</span>
              <div className="flex-1 min-w-0">
                <span className="text-gray-300 text-xs font-medium truncate block">
                  {track.name}
                </span>
                <span className="text-gray-500 text-[9px] truncate block">
                  {Math.round(track.volume * 100)}%{track.muted && ' • M'}
                </span>
              </div>
            </div>
            
            {/* Steps da track */}
            <div className="flex-1 flex gap-[2px] overflow-hidden">
              {track.pattern.slice(visibleRange.start, visibleRange.end).map((step, stepIndex) => {
                const actualStep = visibleRange.start + stepIndex;
                const isPlaying = currentStep === actualStep;
                const hasNote = step.note !== null && step.velocity > 0;
                const isBarStart = actualStep % stepsPerBar === 0;
                const isBeatStart = actualStep % stepsPerBeat === 0;
                
                return (
                  <button
                    key={stepIndex}
                    onClick={() => onStepClick(track.id, actualStep)}
                    className={`
                      rounded transition-all duration-75 relative shrink-0
                      ${hasNote ? TRACK_COLORS[track.type] : 'bg-gray-800 hover:bg-gray-700'}
                      ${hasNote ? 'shadow-md' : ''}
                      ${isPlaying ? 'ring-1 ring-white ring-offset-0' : ''}
                      ${isBarStart ? 'border-l border-deck-accent' : ''}
                      ${isBeatStart && !isBarStart ? 'border-l border-white/10' : ''}
                      ${isPlaying && hasNote ? 'brightness-125' : ''}
                    `}
                    style={{
                      width: `${zoomLevel * 20}px`,
                      height: '28px',
                      opacity: hasNote ? 0.3 + (step.velocity * 0.7) : 1,
                    }}
                    title={`Step ${actualStep + 1}${step.note ? `: ${step.note}` : ''}`}
                  >
                    {/* Indicador de nota para steps ativos */}
                    {hasNote && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="bg-white/20 rounded-full"
                          style={{
                            width: `${Math.max(4, step.velocity * 12)}px`,
                            height: `${Math.max(4, step.velocity * 12)}px`,
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Glide indicator */}
                    {step.glide && hasNote && (
                      <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-[6px] text-white/60">
                        ➝
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Mini VU meter */}
            <div className="w-8 h-6 bg-black/40 rounded flex items-end justify-center gap-[1px] p-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${
                    !track.muted && track.volume > i * 0.25 ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                  style={{ height: `${(i + 1) * 25}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Progresso</span>
          <span className="font-mono text-deck-accent">{currentStep + 1} / {stepCount}</span>
        </div>
        
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-deck-accent to-pink-500 transition-all duration-100"
            style={{ width: `${((currentStep + 1) / stepCount) * 100}%` }}
          />
          
          {/* Marcadores de compassos */}
          {Array.from({ length: totalBars + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: `${(i * stepsPerBar / stepCount) * 100}%` }}
            />
          ))}
        </div>
        
        {/* Indicador de posição visual */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(stepCount, 64) }).map((_, i) => {
            const stepSize = Math.ceil(stepCount / 64);
            const actualStep = i * stepSize;
            const isCurrent = currentStep >= actualStep && currentStep < actualStep + stepSize;
            
            return (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-75 ${
                  isCurrent ? 'bg-deck-accent' : 'bg-gray-700'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Controles de range visível */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Visível: {visibleRange.start + 1}-{visibleRange.end} ({visibleRange.end - visibleRange.start} steps)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setVisibleRange({ start: 0, end: Math.min(32, stepCount) })}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          >
            Início
          </button>
          <button
            onClick={() => {
              const stepsPerView = Math.floor(32 / zoomLevel);
              setVisibleRange({ start: Math.max(0, stepCount - stepsPerView), end: stepCount });
            }}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          >
            Fim
          </button>
        </div>
      </div>
    </div>
  );
}
