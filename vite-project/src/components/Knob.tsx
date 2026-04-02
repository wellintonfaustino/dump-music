import { useState, useCallback, useRef, useEffect } from 'react';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function Knob({
  value,
  min = 0,
  max = 100,
  onChange,
  label,
  size = 'md',
  color = '#e94560',
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const knobRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = -135 + (percentage / 100) * 270;

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
      if (!isDragging) return;
      
      const deltaY = startYRef.current - e.clientY;
      const sensitivity = (max - min) / 200;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
      onChange(Math.round(newValue));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const deltaY = startYRef.current - e.touches[0].clientY;
      const sensitivity = (max - min) / 200;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
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

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={knobRef}
        className={`${sizeClasses[size]} rounded-full cursor-pointer relative select-none`}
        style={{
          background: `linear-gradient(145deg, #1e3a5f, #0a1628)`,
          boxShadow: isDragging
            ? `inset 3px 3px 6px #0a0a0f, inset -3px -3px 6px #2a4a7f`
            : `5px 5px 10px #0a0a0f, -5px -5px 10px #2a4a5f, inset 0 2px 4px rgba(255,255,255,0.1)`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute w-1.5 rounded-full"
          style={{
            height: size === 'sm' ? '16px' : size === 'lg' ? '24px' : '20px',
            backgroundColor: color,
            top: '8%',
            left: '50%',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: `50% ${size === 'sm' ? '22px' : size === 'lg' ? '34px' : '28px'}`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        />
        
        <div className="absolute inset-0 rounded-full pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#2a3a5f"
              strokeWidth="3"
              strokeDasharray="6 6"
            />
          </svg>
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
