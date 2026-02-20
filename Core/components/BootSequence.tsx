import { useEffect, useMemo, useState } from 'react';

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const streams = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ id: i, left: `${(i / 28) * 100}%`, delay: `${(i % 6) * 0.3}s` })),
    [],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((v) => {
        if (v >= 100) {
          window.clearInterval(timer);
          window.setTimeout(onDone, 280);
          return 100;
        }
        return v + 5;
      });
    }, 95);
    return () => window.clearInterval(timer);
  }, [onDone]);

  return (
    <section className="boot-sequence">
      <div className="matrix-rain" aria-hidden>
        {streams.map((stream) => (
          <span key={stream.id} style={{ left: stream.left, animationDelay: stream.delay }}>
            10100110
          </span>
        ))}
      </div>
      <div className="boot-card">
        <img src="Gui/Images/symbol_01.png" alt="rootaccess" />
        <h1>ROOTACCESS</h1>
        <p>Initializing encrypted desktop shell...</p>
        <div className="boot-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
