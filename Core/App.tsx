import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import './firebase';
import { CyberBackground } from './components/CyberBackground';
import { playHover, playOpen } from './audio';
import { ROOT_APPS, type RootAppId } from './appRegistry';
import { loginWithEmail, logout, registerWithEmail, watchAuth } from './services/auth';
import { ensurePlayerProfile, watchPlayerProfile } from './services/profile';
import { executeCommand } from './services/gameActions';
import type { PlayerProfile } from './types/domain';

type SessionState = 'boot' | 'auth-loading' | 'login' | 'desktop';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const topZ = useMemo(() => Math.max(...windows.map((w) => w.z)), [windows]);

  useEffect(() => {
    let unwatchProfile: (() => void) | undefined;

    const unsubscribe = watchAuth((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        unwatchProfile?.();
        unwatchProfile = undefined;
        setProfile(null);
        setSession('login');
        return;
      }

      ensurePlayerProfile(nextUser).catch(() => undefined);
      unwatchProfile?.();
      unwatchProfile = watchPlayerProfile(nextUser.uid, (nextProfile) => {
        setProfile(nextProfile);
        setSession('desktop');
      });
    });

    return () => {
      unwatchProfile?.();
      unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (session !== 'auth-loading' || user) return;

    const timeout = window.setTimeout(() => {
      setSession('login');
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [session, user]);

  const focusWindow = (id: RootAppId) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, z: topZ + 1, minimized: false } : w)));
  };

  const setWindowState = (id: RootAppId, update: Partial<WindowState>) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, ...update } : w)));
  };

  const runIntro = () => {
    window.setTimeout(() => setSession('auth-loading'), 2800);
  };

  if (session === 'boot') {
    return <BootSequence onDone={runIntro} />;
  }

  if (session === 'auth-loading') {
    return <LoadingShell />;
  }

  if (session === 'login') {
    return <LoginShell />;
  }

  const isAdmin = Boolean(profile?.isAdmin);
  const isBanned = Boolean(profile?.isBanned);

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
      <header className="desktop-top">ROOTACCESS // OPERATOR DESKTOP</header>
      <div className="status-chip">
        <span>{user?.email ?? 'anonymous'}</span>
        {isAdmin && <span className="pill">ADMIN</span>}
        {isBanned && <span className="pill warning">BANNED</span>}
        <button onClick={() => logout()}>Sign out</button>
      </div>

      {!isBanned &&
        windows.map((win) => {
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
              <div className="window-content">{renderApp(win.id, profile)}</div>
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

function LoadingShell() {
  return (
    <section className="login-shell">
      <CyberBackground />
      <div className="desktop-overlay" />
      <div className="login-card">
        <h2>Authenticating Session</h2>
        <p>Syncing profile + role flags...</p>
      </div>
    </section>
  );
}

function LoginShell() {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [error, setError] = useState<string>('');

  return (
    <section className="login-shell">
      <CyberBackground />
      <div className="desktop-overlay" />
      <form
        className="login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          const formData = new FormData(e.currentTarget);
          const email = String(formData.get('email') ?? '');
          const password = String(formData.get('password') ?? '');

          try {
            if (mode === 'signin') {
              await loginWithEmail(email, password);
            } else {
              await registerWithEmail(email, password);
            }
            playOpen();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Authentication failed');
          }
        }}
      >
        <img src="Gui/Images/HeroCard2.png" alt="RootAccess operator" />
        <h2>{mode === 'signin' ? 'Access Node' : 'Create Operator'}</h2>
        <input required name="email" placeholder="Email" type="email" />
        <input minLength={6} required name="password" placeholder="Password" type="password" />
        <button type="submit">{mode === 'signin' ? 'Sign In' : 'Register'}</button>
        <button type="button" onClick={() => setMode((prev) => (prev === 'signin' ? 'register' : 'signin'))}>
          {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}

function renderApp(id: RootAppId, profile: PlayerProfile | null) {
  switch (id) {
    case 'terminal':
      return <TerminalPanel profile={profile} />;
    case 'black-market':
      return <PanelList title="Command Lessons" items={['phish // Ø5', 'scan-port // Ø80', 'load-gitconfig // Ø300']} />;
    case 'blockchain':
      return <PanelList title="Stocks" items={['$VALK', '$GLYPH', '$ZERO', '$PULSE', '$TITAN']} />;
    case 'casino':
      return <PanelList title="Casino" items={['Luck 10 badge track', 'ƒ Flux rewards', 'Neon slots + cards']} />;
    case 'profile':
      return (
        <PanelList
          title="Profile"
          items={[
            `Level ${profile?.level ?? 1}`,
            `Ø ${profile?.nops ?? 0}`,
            `ƒ ${profile?.flux ?? 0}`,
            `Rank points: ${profile?.rankPoints ?? 0}`,
            `Admin: ${profile?.isAdmin ? 'Yes' : 'No'}`,
          ]}
        />
      );
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

function TerminalPanel({ profile }: { profile: PlayerProfile | null }) {
  const [result, setResult] = useState<string>('Type `phish` to run secure command callable.');

  return (
    <div className="panel terminal">
      <p>root@access:~$ phish</p>
      <p>[Wallet] Ø{profile?.nops ?? 0}</p>
      <button
        onClick={async () => {
          const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          try {
            const response = await executeCommand({ commandId: 'phish', nonce });
            setResult(response.ok ? `[OK] Reward posted: Ø${response.reward ?? 0}` : '[FAIL] Command denied by backend');
          } catch (cause) {
            setResult(cause instanceof Error ? `[ERR] ${cause.message}` : '[ERR] Unknown failure');
          }
        }}
      >
        Run secure command
      </button>
      <p className="prompt">{result}</p>
    </div>
  );
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
