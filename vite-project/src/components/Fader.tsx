import { useState, useCallback, useRef, useEffect } from 'react';

interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
  color?: string;
}

export default function Fader({
  value,
  min = 0,
  max = 100,
  onChange,
  label,
  color = '#e94560',
}: FaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  }, [value]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const trackHeight = rect.height - 64;
      const relativeY = e.clientY - rect.top - 32;
      const percentage = 1 - (relativeY / trackHeight);
      const newValue = Math.max(min, Math.min(max, min + percentage * (max - min)));
      onChange(Math.round(newValue));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const trackHeight = rect.height - 64;
      const relativeY = e.touches[0].clientY - rect.top - 32;
      const percentage = 1 - (relativeY / trackHeight);
      const newValue = Math.max(min, Math.min(max, min + percentage * (max - min)));
      onChange(Math.round(newValue));
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, min, max, onChange]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={trackRef}
        className="relative w-14 h-56 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl cursor-pointer"
        style={{
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute top-3 bottom-3 left-1/2 w-0.5 -translate-x-1/2 bg-gray-700 rounded" />
        
        <div
          className="absolute left-1/2 w-12 h-16 -translate-x-1/2 rounded-lg cursor-grab active:cursor-grabbing"
          style={{
            bottom: `${percentage}%`,
            transform: `translate(-50%, ${percentage}%)`,
            background: `linear-gradient(145deg, #2a3a5f, #1a2a4f)`,
            boxShadow: isDragging
              ? 'inset 2px 2px 4px #0a0a0f, inset -2px -2px 4px #2a4a7f'
              : '0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)',
            transition: isDragging ? 'none' : 'bottom 0.1s ease-out',
          }}
        >
          <div
            className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2"
            style={{ backgroundColor: color }}
          />
          
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1.5 h-0.5 bg-gray-500 rounded" />
            ))}
          </div>
        </div>

        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col gap-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-px bg-gray-600" />
          ))}
        </div>
      </div>
      
      {label && (
        <div className="text-center">
          <span className="text-gray-400 text-xs uppercase tracking-wider block">{label}</span>
          <span className="text-white text-sm font-mono">{value}</span>
        </div>
      )}
    </div>
  );
}
