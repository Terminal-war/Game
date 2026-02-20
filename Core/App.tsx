import { useMemo, useState } from 'react';
import './firebase';
import { CyberBackground } from './components/CyberBackground';
import { playHover, playOpen } from './audio';

type WindowDef = {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  z: number;
};

const initialWindows: WindowDef[] = [
  { id: 'terminal', title: 'Terminal', icon: 'Gui/Images/Icon01.png', x: 80, y: 80, w: 520, h: 340, minimized: false, z: 2 },
  { id: 'profile', title: 'Profile', icon: 'Gui/Images/Icon02.png', x: 180, y: 140, w: 420, h: 280, minimized: true, z: 1 },
  { id: 'market', title: 'Black Market', icon: 'Gui/Images/Icon03.png', x: 260, y: 110, w: 460, h: 300, minimized: true, z: 1 },
];

export function App() {
  const [windows, setWindows] = useState(initialWindows);
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const topZ = useMemo(() => Math.max(...windows.map((w) => w.z)), [windows]);

  const focusWindow = (id: string) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, z: topZ + 1, minimized: false } : w)));
  };

  const setMinimized = (id: string, minimized: boolean) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, minimized } : w)));
  };

  return (
    <main className="desktop-root" onPointerMove={(e) => {
      if (!dragging) return;
      setWindows((state) =>
        state.map((w) => (w.id === dragging.id ? { ...w, x: e.clientX - dragging.dx, y: e.clientY - dragging.dy } : w)),
      );
    }} onPointerUp={() => setDragging(null)}>
      <CyberBackground />
      <div className="desktop-overlay" />
      <header className="desktop-top">ROOTACCESS // PHASE 1 + 2 SHELL</header>

      {windows.map((win) => !win.minimized && (
        <section key={win.id} className="window" style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }} onPointerDown={() => focusWindow(win.id)}>
          <div className="window-bar" onPointerDown={(e) => {
            const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            setDragging({ id: win.id, dx: e.clientX - rect.left, dy: e.clientY - rect.top });
            focusWindow(win.id);
          }}>
            <img src={win.icon} alt="" />
            <span>{win.title}</span>
            <button onClick={() => setMinimized(win.id, true)}>—</button>
          </div>
          <div className="window-content">
            {win.id === 'terminal' && <TerminalPanel />}
            {win.id === 'profile' && <ProfilePanel />}
            {win.id === 'market' && <MarketPanel />}
          </div>
        </section>
      ))}

      <footer className="taskbar">
        {windows.map((w) => (
          <button key={w.id} className={`task-icon ${w.minimized ? 'off' : 'on'}`} onMouseEnter={playHover} onClick={() => { playOpen(); setMinimized(w.id, false); focusWindow(w.id); }}>
            <img src={w.icon} alt={w.title} />
            <span>{w.title}</span>
          </button>
        ))}
      </footer>
    </main>
  );
}

function TerminalPanel() {
  return (
    <div className="panel terminal">
      <p>root@access:~$ phish</p>
      <p>[OK] Signal traced. +Ø3 NOP</p>
      <p className="prompt">Type commands (Phase 4 will connect secure backend execution).</p>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className="panel">
      <img className="hero" src="Gui/Images/HeroCard.png" alt="avatar panel" />
      <p>Level 1 // Rank: Unranked // Ø 0 // ƒ 0</p>
      <p>Responsive desktop shell active.</p>
    </div>
  );
}

function MarketPanel() {
  return (
    <div className="panel">
      <p>Black Market staging...</p>
      <ul>
        <li>phish lesson // Ø 5</li>
        <li>scan-port lesson // Ø 80</li>
        <li>load-gitconfig software // Ø 300</li>
      </ul>
    </div>
  );
}
