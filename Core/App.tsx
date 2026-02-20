import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { CyberBackground } from './components/CyberBackground';
import { BootSequence } from './components/BootSequence';
import { LoginScreen } from './components/LoginScreen';
import { playHover, playOpen } from './audio';
import { db, firebaseReady } from './services/firebase';
import { ensurePlayerProfile, getGuestProfile, loadProfile, login, logout, observeAuth, register } from './services/auth';
import { COMMAND_CATALOG, runCommand, STARTER_COMMAND } from './services/commandService';
import type { CasinoBadge, CommandResult, PlayerProfile } from './types/game';

type ScreenState = 'boot' | 'login' | 'desktop';
type AppId = 'terminal' | 'profile' | 'market' | 'index' | 'casino';

type WindowDef = {
  id: AppId;
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
  { id: 'terminal', title: 'Terminal', icon: 'Gui/Images/Icon01.png', x: 80, y: 80, w: 560, h: 360, minimized: false, z: 3 },
  { id: 'profile', title: 'Profile', icon: 'Gui/Images/Icon02.png', x: 190, y: 130, w: 430, h: 300, minimized: true, z: 1 },
  { id: 'market', title: 'Black Market', icon: 'Gui/Images/Icon03.png', x: 260, y: 110, w: 470, h: 320, minimized: true, z: 1 },
  { id: 'index', title: 'Index', icon: 'Gui/Images/IconD09.png', x: 300, y: 120, w: 500, h: 340, minimized: true, z: 1 },
  { id: 'casino', title: 'Casino', icon: 'Gui/Images/IconD12.png', x: 220, y: 100, w: 500, h: 330, minimized: true, z: 2 },
];

const BADGES: CasinoBadge[] = [
  { id: 'lucky-3', title: 'Luck 3', description: 'Win the casino game 3 times in a row.', fluxReward: 2 },
  { id: 'lucky-5', title: 'Luck 5', description: 'Win 5 spins in a row.', fluxReward: 4 },
  { id: 'lucky-10', title: 'Luck 10', description: 'Win 10 spins in a row.', fluxReward: 10 },
];

export function App() {
  const [screen, setScreen] = useState<ScreenState>('boot');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [windows, setWindows] = useState(initialWindows);
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [terminalLog, setTerminalLog] = useState<string[]>(['root@access:~$ help', 'Starter command available: phish']);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const [ownedCommands, setOwnedCommands] = useState<string[]>(['phish']);
  const [missedCommands] = useState<string[]>(['trace-route // missed 2026-02-11']);
  const [casinoStreak, setCasinoStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  const topZ = useMemo(() => Math.max(...windows.map((w) => w.z)), [windows]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const off = observeAuth(async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (!user) {
        if (!firebaseReady) {
          setProfile(getGuestProfile());
          setScreen('desktop');
          return;
        }

        setProfile(null);
        setScreen((old) => (old === 'boot' ? 'boot' : 'login'));
        return;
      }

      await ensurePlayerProfile(user);
      const p = await loadProfile(user.uid);
      setProfile(p);
      setScreen('desktop');

      if (db) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as PlayerProfile);
          }
        });
      }
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      off();
    };
  }, []);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => setCooldownLeft((v) => (v > 0 ? v - 1000 : 0)), 1000);
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

  const executeCommand = async (commandId: string) => {
    if (cooldownLeft > 0) {
      setTerminalLog((s) => [`[WAIT] cooldown ${Math.ceil(cooldownLeft / 1000)}s`, ...s]);
      return;
    }

    const result = await runCommand(commandId);
    setTerminalLog((s) => [lineFromResult(result), ...s]);
    setCooldownLeft(Math.max(result.nextReadyAt - Date.now(), 0));

    if (profile && result.deltaNop !== 0) {
      setProfile({ ...profile, nop: Math.max(0, profile.nop + result.deltaNop), xp: profile.xp + (result.ok ? 4 : 1) });
    }
  };

  const buyLesson = (commandId: string) => {
    const cmd = COMMAND_CATALOG.find((entry) => entry.id === commandId);
    if (!cmd || !profile) return;

    if (ownedCommands.includes(commandId)) {
      setTerminalLog((s) => [`[INFO] ${commandId} already unlocked.`, ...s]);
      return;
    }

    if (profile.nop < cmd.lessonCost) {
      setTerminalLog((s) => [`[DENY] Need Ø${cmd.lessonCost - profile.nop} more for ${commandId}.`, ...s]);
      return;
    }

    setOwnedCommands((state) => [...state, commandId]);
    setProfile({ ...profile, nop: profile.nop - cmd.lessonCost });
    setTerminalLog((s) => [`[UNLOCK] ${commandId} lesson complete. command added to index.`, ...s]);
  };

  const playCasinoRound = (bet: number) => {
    if (!profile || bet <= 0) return;
    if (profile.nop < bet) {
      setTerminalLog((s) => ['[CASINO] insufficient Ø for that bet.', ...s]);
      return;
    }

    const win = Math.random() < 0.47;
    let nextProfile = { ...profile, nop: profile.nop - bet };

    if (win) {
      const payout = bet * 2;
      nextProfile = { ...nextProfile, nop: nextProfile.nop + payout };
      setCasinoStreak((streak) => {
        const next = streak + 1;
        grantBadges(next);
        return next;
      });
      setTerminalLog((s) => [`[CASINO-WIN] +Ø${bet} net profit. streak up.`, ...s]);
    } else {
      setCasinoStreak(0);
      setTerminalLog((s) => [`[CASINO-LOSS] -Ø${bet}. streak reset.`, ...s]);
    }

    setProfile(nextProfile);
  };

  const grantBadges = (streak: number) => {
    if (!profile) return;

    BADGES.forEach((badge, idx) => {
      const requirement = [3, 5, 10][idx];
      if (streak >= requirement && !badges.includes(badge.id)) {
        setBadges((state) => [...state, badge.id]);
        setProfile((prev) => (prev ? { ...prev, flux: prev.flux + badge.fluxReward } : prev));
        setTerminalLog((s) => [`[BADGE] ${badge.title} earned +ƒ${badge.fluxReward}`, ...s]);
      }
    });
  };

  if (screen === 'boot') return <BootSequence onDone={() => setScreen(firebaseReady ? 'login' : 'desktop')} />;

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
        ROOTACCESS // {profile?.handle ?? 'Operator'} // Ø{profile?.nop ?? 0} // ƒ{profile?.flux ?? 0} // LVL {profile?.level ?? 1}
      </header>
      {!firebaseReady && <div className="guest-banner">Guest mode active: configure Firebase env for cloud persistence.</div>}
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
                    onRunStarter={() => executeCommand(STARTER_COMMAND.id)}
                    onRunOwned={(commandId) => executeCommand(commandId)}
                    cooldownLeft={Math.ceil(cooldownLeft / 1000)}
                    ownedCommands={ownedCommands}
                  />
                )}
                {win.id === 'profile' && <ProfilePanel profile={profile} badges={badges} streak={casinoStreak} />}
                {win.id === 'market' && (
                  <MarketPanel
                    profile={profile}
                    ownedCommands={ownedCommands}
                    onBuyLesson={buyLesson}
                  />
                )}
                {win.id === 'index' && <IndexPanel ownedCommands={ownedCommands} missedCommands={missedCommands} />}
                {win.id === 'casino' && (
                  <CasinoPanel
                    profile={profile}
                    streak={casinoStreak}
                    badges={badges}
                    onBet={playCasinoRound}
                  />
                )}
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

function TerminalPanel({
  log,
  onRunStarter,
  onRunOwned,
  cooldownLeft,
  ownedCommands,
}: {
  log: string[];
  onRunStarter: () => Promise<void>;
  onRunOwned: (commandId: string) => Promise<void>;
  cooldownLeft: number;
  ownedCommands: string[];
}) {
  return (
    <div className="panel terminal">
      <p className="prompt">Starter command: phish // cooldown {cooldownLeft}s</p>
      <div className="terminal-controls">
        <button className="run-btn" onClick={() => onRunStarter()}>
          Run phish
        </button>
        {ownedCommands
          .filter((cmd) => cmd !== 'phish')
          .map((cmd) => (
            <button key={cmd} className="run-btn" onClick={() => onRunOwned(cmd)}>
              Run {cmd}
            </button>
          ))}
      </div>
      <div className="terminal-log">
        {log.map((line, idx) => (
          <p key={`${line}-${idx}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function ProfilePanel({ profile, badges, streak }: { profile: PlayerProfile | null; badges: string[]; streak: number }) {
  return (
    <div className="panel">
      <img className="hero" src="Gui/Images/HeroCard.png" alt="avatar panel" />
      <p>Handle: {profile?.handle ?? 'Unknown'}</p>
      <p>Level {profile?.level ?? 1} // XP {profile?.xp ?? 0}</p>
      <p>Wallet: Ø {profile?.nop ?? 0} // ƒ {profile?.flux ?? 0}</p>
      <p>Role: {profile?.isAdmin ? 'Admin' : 'Player'}</p>
      <p>Casino streak: {streak}</p>
      <p>Badges: {badges.length ? badges.join(', ') : 'None yet'}</p>
    </div>
  );
}

function MarketPanel({
  profile,
  ownedCommands,
  onBuyLesson,
}: {
  profile: PlayerProfile | null;
  ownedCommands: string[];
  onBuyLesson: (commandId: string) => void;
}) {
  return (
    <div className="panel">
      <p>Black Market // wallet Ø{profile?.nop ?? 0}</p>
      <ul className="shop-list">
        {COMMAND_CATALOG.filter((cmd) => cmd.lessonCost > 0).map((cmd) => {
          const owned = ownedCommands.includes(cmd.id);
          return (
            <li key={cmd.id}>
              <div>
                <strong>{cmd.label}</strong>
                <p>Lesson Ø{cmd.lessonCost} // Req Lv {cmd.requiredLevel}</p>
              </div>
              <button className="run-btn" disabled={owned} onClick={() => onBuyLesson(cmd.id)}>
                {owned ? 'Owned' : 'Buy Lesson'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IndexPanel({ ownedCommands, missedCommands }: { ownedCommands: string[]; missedCommands: string[] }) {
  const locked = COMMAND_CATALOG.map((cmd) => cmd.id).filter((id) => !ownedCommands.includes(id));

  return (
    <div className="panel index-grid">
      <div>
        <h4>Owned Commands</h4>
        <ul>{ownedCommands.map((cmd) => <li key={cmd}>{cmd}</li>)}</ul>
      </div>
      <div>
        <h4>Locked Commands</h4>
        <ul>{locked.map((cmd) => <li key={cmd}>{cmd}</li>)}</ul>
      </div>
      <div>
        <h4>Missed Limiteds</h4>
        <ul>{missedCommands.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

function CasinoPanel({
  profile,
  streak,
  badges,
  onBet,
}: {
  profile: PlayerProfile | null;
  streak: number;
  badges: string[];
  onBet: (bet: number) => void;
}) {
  return (
    <div className="panel casino-panel">
      <p>Neon Pulse Casino // Wallet Ø{profile?.nop ?? 0} // Flux ƒ{profile?.flux ?? 0}</p>
      <p>Current streak: {streak}</p>
      <div className="casino-actions">
        {[5, 10, 25].map((bet) => (
          <button key={bet} className="run-btn" onClick={() => onBet(bet)}>
            Bet Ø{bet}
          </button>
        ))}
      </div>
      <h4>Badge Track</h4>
      <ul>
        {BADGES.map((badge) => (
          <li key={badge.id}>
            {badges.includes(badge.id) ? '✅' : '⬜'} {badge.title} — {badge.description} (+ƒ{badge.fluxReward})
          </li>
        ))}
      </ul>
    </div>
  );
}
