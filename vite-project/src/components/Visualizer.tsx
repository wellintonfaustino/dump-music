import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../hooks/useAudio.ts';

export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const data = audioEngine.getAnalyserData();
      
      if (data.length > 0) {
        setIsActive(true);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / data.length;

      for (let i = 0; i < data.length; i++) {
        const value = data[i];
        const percent = value / 255;
        const height = canvas.height * percent;
        const x = i * barWidth;
        const y = canvas.height - height;

        const hue = (i / data.length) * 180 + 160;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${percent})`;
        
        ctx.fillRect(x, y, barWidth - 1, height);

        ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${percent * 0.5})`;
        ctx.fillRect(x, y - 5, barWidth - 1, 5);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-black/50 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs uppercase tracking-wider">
          Visualizador
        </span>
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-24 rounded bg-gradient-to-b from-gray-900 to-black"
      />
    </div>
  );
}
