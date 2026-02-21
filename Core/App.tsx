import { useEffect, useMemo, useState } from 'react';
import './firebase';
import { CyberBackground } from './components/CyberBackground';
import { playHover, playOpen } from './audio';
import { ROOT_APPS, type RootAppId } from './appRegistry';

type SessionState = 'boot' | 'login' | 'desktop';

type WindowState = {
  id: RootAppId;
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
};

const MIN_W = 340;
const MIN_H = 240;

function buildInitialWindows(): WindowState[] {
  return ROOT_APPS.map((app, index) => ({
    id: app.id,
    minimized: app.id !== 'terminal',
    maximized: false,
    x: app.starterLayout.x,
    y: app.starterLayout.y,
    w: app.starterLayout.w,
    h: app.starterLayout.h,
    z: index + 1,
  }));
}

export function App() {
  const [session, setSession] = useState<SessionState>('boot');
  const [windows, setWindows] = useState<WindowState[]>(buildInitialWindows);
  const [dragging, setDragging] = useState<{ id: RootAppId; dx: number; dy: number } | null>(null);

  const topZ = useMemo(() => Math.max(...windows.map((w) => w.z)), [windows]);
  const isAdmin = false;

  const focusWindow = (id: RootAppId) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, z: topZ + 1, minimized: false } : w)));
  };

  const setWindowState = (id: RootAppId, update: Partial<WindowState>) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, ...update } : w)));
  };

  const runIntro = () => {
    window.setTimeout(() => setSession('login'), 2800);
  };

  if (session === 'boot') {
    return <BootSequence onDone={runIntro} />;
  }

  if (session === 'login') {
    return <LoginShell onLogin={() => setSession('desktop')} />;
  }

  return (
    <main
      className="desktop-root"
      onPointerMove={(e) => {
        if (!dragging) return;
        setWindows((state) =>
          state.map((w) => {
            if (w.id !== dragging.id || w.maximized) return w;
            const maxX = Math.max(0, window.innerWidth - 240);
            const maxY = Math.max(24, window.innerHeight - 120);
            return {
              ...w,
              x: Math.max(0, Math.min(maxX, e.clientX - dragging.dx)),
              y: Math.max(24, Math.min(maxY, e.clientY - dragging.dy)),
            };
          }),
        );
      }}
      onPointerUp={() => setDragging(null)}
    >
      <CyberBackground />
      <div className="desktop-overlay" />
      <header className="desktop-top">ROOTACCESS // DESKTOP SHELL ALPHA</header>

      {windows.map((win) => {
        const app = ROOT_APPS.find((candidate) => candidate.id === win.id);
        if (!app || (app.lockedToAdmin && !isAdmin) || win.minimized) return null;

        return (
          <section
            key={win.id}
            className="window"
            style={
              win.maximized
                ? { inset: '48px 20px 86px', zIndex: win.z }
                : { left: win.x, top: win.y, width: Math.max(MIN_W, win.w), height: Math.max(MIN_H, win.h), zIndex: win.z }
            }
            onPointerDown={() => focusWindow(win.id)}
          >
            <div
              className="window-bar"
              onPointerDown={(e) => {
                if (win.maximized) return;
                const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                setDragging({ id: win.id, dx: e.clientX - rect.left, dy: e.clientY - rect.top });
                focusWindow(win.id);
              }}
            >
              <img src={app.icon} alt="" />
              <span>{app.title}</span>
              <button onClick={() => setWindowState(win.id, { minimized: true })}>—</button>
              <button onClick={() => setWindowState(win.id, { maximized: !win.maximized })}>{win.maximized ? '🗗' : '🗖'}</button>
            </div>
            <div className="window-content">{renderApp(win.id)}</div>
          </section>
        );
      })}

      <footer className="taskbar">
        {ROOT_APPS.filter((app) => !app.lockedToAdmin || isAdmin).map((app) => {
          const win = windows.find((item) => item.id === app.id)!;
          return (
            <button
              key={app.id}
              className={`task-icon ${win.minimized ? 'off' : 'on'}`}
              onMouseEnter={playHover}
              onClick={() => {
                playOpen();
                setWindowState(app.id, { minimized: false });
                focusWindow(app.id);
              }}
            >
              <img src={app.icon} alt={app.title} />
              <span>{app.title}</span>
            </button>
          );
        })}
      </footer>
    </main>
  );
}

function BootSequence({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    onDone();
  }, [onDone]);

  return (
    <section className="boot-screen">
      <CyberBackground />
      <div className="binary-rain" aria-hidden>
        {'101001001011010100101010101001100100101'.repeat(9)}
      </div>
      <div className="boot-text">
        <h1>ROOTACCESS</h1>
        <p>linking ghost nodes . . .</p>
      </div>
    </section>
  );
}

function LoginShell({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="login-shell">
      <CyberBackground />
      <div className="desktop-overlay" />
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault();
          playOpen();
          onLogin();
        }}
      >
        <img src="Gui/Images/HeroCard2.png" alt="RootAccess operator" />
        <h2>Access Node</h2>
        <input required placeholder="Email" type="email" />
        <input required placeholder="Password" type="password" />
        <button type="submit">Sign In</button>
      </form>
    </section>
  );
}

function renderApp(id: RootAppId) {
  switch (id) {
    case 'terminal':
      return (
        <div className="panel terminal">
          <p>root@access:~$ phish</p>
          <p>[OK] Proxy chain established. +Ø3 NOP</p>
          <p>[CD] phish cooldown: 00:10</p>
          <p className="prompt">Phase 3+ hooks Firebase auth + secure command execution.</p>
        </div>
      );
    case 'black-market':
      return <PanelList title="Command Lessons" items={['phish // Ø5', 'scan-port // Ø80', 'load-gitconfig // Ø300']} />;
    case 'blockchain':
      return <PanelList title="Stocks" items={['$VALK', '$GLYPH', '$ZERO', '$PULSE', '$TITAN']} />;
    case 'casino':
      return <PanelList title="Casino" items={['Luck 10 badge track', 'ƒ Flux rewards', 'Neon slots + cards']} />;
    case 'profile':
      return <PanelList title="Profile" items={['Level 1', 'Ø 0', 'ƒ 0', 'Rank: Unranked']} />;
    case 'pvp':
      return <PanelList title="PvP Lobby" items={['Queue', 'Ready check', 'Shard ratio scoring']} />;
    case 'settings':
      return <PanelList title="Settings" items={['SFX volume', 'Graphics quality', 'Motion intensity']} />;
    case 'index':
      return <PanelList title="Command Index" items={['Owned', 'Locked', 'Traits', 'Missed limiteds']} />;
    case 'admin':
      return <PanelList title="Admin" items={['Global event controls', 'Shop config', 'Moderation logs']} />;
    default:
      return null;
  }
}

function PanelList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
