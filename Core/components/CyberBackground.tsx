import { useEffect, useRef } from 'react';
import { initCyberGrid } from '../webgl/cyberGrid';

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return initCyberGrid(canvasRef.current);
  }, []);

  return <canvas aria-hidden className="cyber-bg" ref={canvasRef} />;
}
