import { useEffect, useRef } from 'react';
import { initCyberGrid } from '../webgl/cyberGrid';

type Props = {
  quality: 'low' | 'medium' | 'high';
};

export function CyberBackground({ quality }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return initCyberGrid(canvasRef.current, quality);
  }, [quality]);

  return <canvas aria-hidden className="cyber-bg" ref={canvasRef} />;
}
