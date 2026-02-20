import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { CyberBackground } from './components/CyberBackground';
import { BootSequence } from './components/BootSequence';
import { LoginScreen } from './components/LoginScreen';
import { playHover, playOpen } from './audio';
import { db } from './services/firebase';
import { ensurePlayerProfile, loadProfile, login, logout, observeAuth, register } from './services/auth';
import { runCommand, STARTER_COMMAND } from './services/commandService';
import type { CommandResult, PlayerProfile } from './types/game';

type ScreenState = 'boot' | 'login' | 'desktop';

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
  { id: 'terminal', title: 'Terminal', icon: 'Gui/Images/Icon01.png', x: 80, y: 80, w: 560, h: 360, minimized: false, z: 2 },
  { id: 'profile', title: 'Profile', icon: 'Gui/Images/Icon02.png', x: 190, y: 130, w: 430, h: 290, minimized: true, z: 1 },
  { id: 'market', title: 'Black Market', icon: 'Gui/Images/Icon03.png', x: 270, y: 110, w: 460, h: 300, minimized: true, z: 1 },
];

export function App() {
  const [screen, setScreen] = useState<ScreenState>('boot');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [windows, setWindows] = useState(initialWindows);
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [terminalLog, setTerminalLog] = useState<string[]>(['root@access:~$ phish']);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const topZ = useMemo(() => Math.max(...windows.map((w) => w.z)), [windows]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const off = observeAuth(async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (!user) {
        setProfile(null);
        setScreen((old) => (old === 'boot' ? 'boot' : 'login'));
        return;
      }

      await ensurePlayerProfile(user);
      const p = await loadProfile(user.uid);
      setProfile(p);
      setScreen('desktop');

      unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as PlayerProfile);
        }
      });
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      off();
    };
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((v) => (v > 0 ? v - 1000 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  const signIn = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await login(email, password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async (email: string, password: string, handle: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await register(email, password, handle);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const focusWindow = (id: string) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, z: topZ + 1, minimized: false } : w)));
  };

  const setMinimized = (id: string, minimized: boolean) => {
    setWindows((state) => state.map((w) => (w.id === id ? { ...w, minimized } : w)));
  };

  const executeStarterCommand = async () => {
    if (cooldownLeft > 0) {
      setTerminalLog((s) => [`[WAIT] cooldown ${Math.ceil(cooldownLeft / 1000)}s`, ...s]);
      return;
    }

    const result = await runCommand(STARTER_COMMAND.id);
    setTerminalLog((s) => [lineFromResult(result), ...s]);
    setCooldownLeft(Math.max(result.nextReadyAt - Date.now(), 0));

    if (profile && result.deltaNop !== 0) {
      setProfile({ ...profile, nop: Math.max(0, profile.nop + result.deltaNop) });
    }
  };

  if (screen === 'boot') {
    return <BootSequence onDone={() => setScreen('login')} />;
  }

  if (screen === 'login') {
    return <LoginScreen onSignIn={signIn} onRegister={signUp} loading={authLoading} error={authError} />;
  }

  return (
    <main
      className="desktop-root"
      onPointerMove={(e) => {
        if (!dragging) return;
        setWindows((state) =>
          state.map((w) => (w.id === dragging.id ? { ...w, x: e.clientX - dragging.dx, y: e.clientY - dragging.dy } : w)),
        );
      }}
      onPointerUp={() => setDragging(null)}
    >
      <CyberBackground />
      <div className="desktop-overlay" />
      <header className="desktop-top">
        ROOTACCESS // {profile?.handle ?? 'Operator'} // Ø{profile?.nop ?? 0} // LVL {profile?.level ?? 1}
      </header>
      <button className="logout-btn" onClick={() => logout()}>
        Logout
      </button>

      {windows.map(
        (win) =>
          !win.minimized && (
            <section
              key={win.id}
              className="window"
              style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
              onPointerDown={() => focusWindow(win.id)}
            >
              <div
                className="window-bar"
                onPointerDown={(e) => {
                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                  setDragging({ id: win.id, dx: e.clientX - rect.left, dy: e.clientY - rect.top });
                  focusWindow(win.id);
                }}
              >
                <img src={win.icon} alt="" />
                <span>{win.title}</span>
                <button onClick={() => setMinimized(win.id, true)}>—</button>
              </div>
              <div className="window-content">
                {win.id === 'terminal' && (
                  <TerminalPanel
                    log={terminalLog}
                    onRun={executeStarterCommand}
                    cooldownLeft={Math.ceil(cooldownLeft / 1000)}
                  />
                )}
                {win.id === 'profile' && <ProfilePanel profile={profile} />}
                {win.id === 'market' && <MarketPanel />}
              </div>
            </section>
          ),
      )}

      <footer className="taskbar">
        {windows.map((w) => (
          <button
            key={w.id}
            className={`task-icon ${w.minimized ? 'off' : 'on'}`}
            onMouseEnter={playHover}
            onClick={() => {
              playOpen();
              setMinimized(w.id, false);
              focusWindow(w.id);
            }}
          >
            <img src={w.icon} alt={w.title} />
            <span>{w.title}</span>
          </button>
        ))}
      </footer>
    </main>
  );
}

function lineFromResult(result: CommandResult) {
  if (result.reason === 'COOLDOWN') return '[WAIT] command cooldown active';
  if (result.ok) return `[OK] ${result.commandId} success +Ø${result.deltaNop} // trace ${result.traceId}`;
  return `[FAIL] ${result.commandId} tripped alarm Ø${result.deltaNop} // trace ${result.traceId}`;
}

function TerminalPanel({ log, onRun, cooldownLeft }: { log: string[]; onRun: () => Promise<void>; cooldownLeft: number }) {
  return (
    <div className="panel terminal">
      <p className="prompt">Starter command: phish // cooldown {cooldownLeft}s</p>
      <button className="run-btn" onClick={() => onRun()}>
        Run phish
      </button>
      <div className="terminal-log">
        {log.map((line, idx) => (
          <p key={`${line}-${idx}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function ProfilePanel({ profile }: { profile: PlayerProfile | null }) {
  return (
    <div className="panel">
      <img className="hero" src="Gui/Images/HeroCard.png" alt="avatar panel" />
      <p>Handle: {profile?.handle ?? 'Unknown'}</p>
      <p>Level {profile?.level ?? 1} // XP {profile?.xp ?? 0}</p>
      <p>Wallet: Ø {profile?.nop ?? 0} // ƒ {profile?.flux ?? 0}</p>
      <p>Role: {profile?.isAdmin ? 'Admin' : 'Player'}</p>
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
