import type { Track } from '../types/audio.ts';

interface SequencerProps {
  tracks: Track[];
  currentStep: number;
  onStepClick: (trackId: string, stepIndex: number) => void;
}

const TRACK_COLORS: Record<string, string> = {
  melody: 'bg-blue-500',
  bass: 'bg-purple-500',
  percussion: 'bg-orange-500',
  effect: 'bg-pink-500',
};

export default function Sequencer({ tracks, currentStep, onStepClick }: SequencerProps) {
  return (
    <div className="bg-deck-panel/80 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-deck-accent font-bold uppercase tracking-wider text-sm">Sequenciador</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-400 text-xs">Melodia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-400 text-xs">Baixo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-gray-400 text-xs">Percussão</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-pink-500"></div>
            <span className="text-gray-400 text-xs">Efeitos</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-2">
            <div className="w-24 flex items-center gap-2">
              <span className="text-gray-300 text-sm font-medium truncate">{track.name}</span>
              {track.muted && (
                <span className="text-red-500 text-xs">M</span>
              )}
            </div>
            
            <div className="flex-1 grid grid-cols-16 gap-1">
              {track.pattern.map((step, stepIndex) => {
                const isPlaying = currentStep === stepIndex;
                const hasNote = step.note !== null && step.velocity > 0;
                const isBeat = stepIndex % 4 === 0;
                
                return (
                  <button
                    key={stepIndex}
                    onClick={() => onStepClick(track.id, stepIndex)}
                    className={`
                      aspect-square rounded-md transition-all duration-150 relative
                      ${hasNote ? TRACK_COLORS[track.type] : 'bg-gray-800'}
                      ${hasNote ? 'shadow-lg' : ''}
                      ${isPlaying ? 'ring-2 ring-white ring-offset-1 ring-offset-deck-panel' : ''}
                      ${isBeat ? 'border-l-2 border-gray-600' : ''}
                      ${isPlaying && hasNote ? 'brightness-125' : ''}
                      hover:brightness-110
                    `}
                    style={{
                      opacity: hasNote ? 0.3 + (step.velocity * 0.7) : 1,
                    }}
                  >
                    {step.note && track.type !== 'percussion' && (
                      <span className="absolute inset-0 flex items-center justify-center text-[6px] text-white font-bold">
                        {step.note}
                      </span>
                    )}
                    
                    {step.note && track.type === 'percussion' && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">
                        {step.note === 'kick' && 'K'}
                        {step.note === 'snare' && 'S'}
                        {step.note === 'hihat' && 'H'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="w-12 text-right">
              <span className="text-gray-500 text-xs font-mono">
                {Math.round(track.volume * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                currentStep === i ? 'bg-deck-accent' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        
        <div className="text-gray-500 text-xs">
          Step: <span className="text-deck-accent font-mono">{currentStep + 1}/16</span>
        </div>
      </div>
    </div>
  );
}
