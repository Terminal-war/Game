import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import './firebase';
import { CyberBackground } from './components/CyberBackground';
import { playHover, playOpen } from './audio';
import { ROOT_APPS, type RootAppId } from './appRegistry';
import { loginWithEmail, logout, registerWithEmail, watchAuth } from './services/auth';
import { executeCommand } from './services/gameActions';
import { completeLesson, watchCommandCatalog, watchLessonProgress, watchPlayerInventory } from './services/market';
import { ensurePlayerProfile, watchPlayerProfile } from './services/profile';
import type { CommandCatalogItem, LessonProgress, PlayerInventoryItem, PlayerProfile } from './types/domain';

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

type TerminalState = {
  lines: string[];
  input: string;
  awaitingPrompt: null | 'git-open' | 'git-bruteforce';
  cooldowns: Record<string, number>;
  busy: boolean;
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

const initialTerminal: TerminalState = {
  lines: ['root@access:~$ type `phish` to start or `help` for command list.'],
  input: '',
  awaitingPrompt: null,
  cooldowns: {},
  busy: false,
};

export function App() {
  const [session, setSession] = useState<SessionState>('boot');
  const [windows, setWindows] = useState<WindowState[]>(buildInitialWindows);
  const [dragging, setDragging] = useState<{ id: RootAppId; dx: number; dy: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [catalog, setCatalog] = useState<CommandCatalogItem[]>([]);
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [terminal, setTerminal] = useState<TerminalState>(initialTerminal);

  const topZ = useMemo(() => Math.max(...windows.map((w) => w.z)), [windows]);

  useEffect(() => {
    let unwatchProfile: (() => void) | undefined;
    let unwatchInventory: (() => void) | undefined;
    let unwatchLessons: (() => void) | undefined;

    const unsubscribeCatalog = watchCommandCatalog(setCatalog);
    const unsubscribe = watchAuth((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        unwatchProfile?.();
        unwatchInventory?.();
        unwatchLessons?.();
        unwatchProfile = undefined;
        unwatchInventory = undefined;
        unwatchLessons = undefined;
        setProfile(null);
        setInventory([]);
        setLessonProgress([]);
        setSession('login');
        return;
      }

      ensurePlayerProfile(nextUser).catch(() => undefined);
      unwatchProfile?.();
      unwatchInventory?.();
      unwatchLessons?.();
      unwatchProfile = watchPlayerProfile(nextUser.uid, (nextProfile) => {
        setProfile(nextProfile);
        setSession('desktop');
      });
      unwatchInventory = watchPlayerInventory(nextUser.uid, setInventory);
      unwatchLessons = watchLessonProgress(nextUser.uid, setLessonProgress);
    });

    return () => {
      unwatchProfile?.();
      unwatchInventory?.();
      unwatchLessons?.();
      unsubscribeCatalog();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session !== 'auth-loading' || user) return;
    const timeout = window.setTimeout(() => setSession('login'), 2200);
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

  if (session === 'boot') return <BootSequence onDone={runIntro} />;
  if (session === 'auth-loading') return <LoadingShell />;
  if (session === 'login') return <LoginShell />;

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
            return { ...w, x: Math.max(0, Math.min(maxX, e.clientX - dragging.dx)), y: Math.max(24, Math.min(maxY, e.clientY - dragging.dy)) };
          }),
        );
      }}
      onPointerUp={() => setDragging(null)}
    >
      <CyberBackground />
      <div className="desktop-overlay" />
      <header className="desktop-top">ROOTACCESS // PHASE 5 + 6</header>
      <div className="status-chip">
        <span>{user?.email ?? 'anonymous'}</span>
        {isAdmin && <span className="pill">ADMIN</span>}
        {isBanned && <span className="pill warning">BANNED</span>}
        <button onClick={() => logout()}>Sign out</button>
      </div>

      {!isBanned && windows.map((win) => {
        const app = ROOT_APPS.find((candidate) => candidate.id === win.id);
        if (!app || (app.lockedToAdmin && !isAdmin) || win.minimized) return null;

        return (
          <section
            key={win.id}
            className="window"
            style={win.maximized ? { inset: '48px 20px 86px', zIndex: win.z } : { left: win.x, top: win.y, width: Math.max(MIN_W, win.w), height: Math.max(MIN_H, win.h), zIndex: win.z }}
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
            <div className="window-content">
              <AppPanel
                appId={win.id}
                profile={profile}
                user={user}
                catalog={catalog}
                inventory={inventory}
                lessonProgress={lessonProgress}
                terminal={terminal}
                onTerminalUpdate={setTerminal}
              />
            </div>
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

function AppPanel({
  appId,
  profile,
  user,
  catalog,
  inventory,
  lessonProgress,
  terminal,
  onTerminalUpdate,
}: {
  appId: RootAppId;
  profile: PlayerProfile | null;
  user: User | null;
  catalog: CommandCatalogItem[];
  inventory: PlayerInventoryItem[];
  lessonProgress: LessonProgress[];
  terminal: TerminalState;
  onTerminalUpdate: (next: TerminalState) => void;
}) {
  switch (appId) {
    case 'terminal':
      return <TerminalPanel terminal={terminal} onTerminalUpdate={onTerminalUpdate} profile={profile} catalog={catalog} inventory={inventory} lessonProgress={lessonProgress} />;
    case 'black-market':
      return <BlackMarketPanel user={user} profile={profile} catalog={catalog} lessonProgress={lessonProgress} />;
    case 'index':
      return <IndexPanel catalog={catalog} inventory={inventory} lessonProgress={lessonProgress} />;
    case 'profile':
      return <PanelList title="Profile" items={[`Level ${profile?.level ?? 1}`, `Ø ${profile?.nops ?? 0}`, `ƒ ${profile?.flux ?? 0}`, `Rank points: ${profile?.rankPoints ?? 0}`, `Admin: ${profile?.isAdmin ? 'Yes' : 'No'}`]} />;
    case 'blockchain':
      return <PanelList title="Stocks" items={['$VALK', '$GLYPH', '$ZERO', '$PULSE', '$TITAN']} />;
    case 'casino':
      return <PanelList title="Casino" items={['Luck 10 badge track', 'ƒ Flux rewards', 'Neon slots + cards']} />;
    case 'pvp':
      return <PanelList title="PvP Lobby" items={['Queue', 'Ready check', 'Shard ratio scoring']} />;
    case 'settings':
      return <PanelList title="Settings" items={['SFX volume', 'Graphics quality', 'Motion intensity']} />;
    case 'admin':
      return <PanelList title="Admin" items={['Global event controls', 'Shop config', 'Moderation logs']} />;
    default:
      return null;
  }
}

function TerminalPanel({ terminal, onTerminalUpdate, profile, catalog, inventory, lessonProgress }: { terminal: TerminalState; onTerminalUpdate: (next: TerminalState) => void; profile: PlayerProfile | null; catalog: CommandCatalogItem[]; inventory: PlayerInventoryItem[]; lessonProgress: LessonProgress[] }) {
  const unlocked = new Set<string>(['phish']);
  inventory.forEach((item) => unlocked.add(item.commandId));
  lessonProgress.filter((item) => item.completed).forEach((item) => unlocked.add(item.commandId));

  const append = (...lines: string[]) => {
    onTerminalUpdate({ ...terminal, lines: [...terminal.lines, ...lines] });
  };

  const runInput = async () => {
    const raw = terminal.input.trim();
    if (!raw) return;
    const lower = raw.toLowerCase();

    onTerminalUpdate({ ...terminal, input: '', lines: [...terminal.lines, `root@access:~$ ${raw}`] });

    if (terminal.awaitingPrompt) {
      if (terminal.awaitingPrompt === 'git-open') {
        if (lower === 'yes') {
          append('Open directory Gitconfig PULSE? yes/no', 'Yes/>< Brute Force', '[TRACE] Brute forcing subkeys... complete. +Ø42');
          onTerminalUpdate({ ...terminal, input: '', awaitingPrompt: null, lines: [...terminal.lines, `root@access:~$ ${raw}`, 'Open directory Gitconfig PULSE? yes/no', 'Yes/>< Brute Force', '[TRACE] Brute forcing subkeys... complete. +Ø42'] });
          return;
        }
        append('[ABORT] sequence canceled.');
        onTerminalUpdate({ ...terminal, input: '', awaitingPrompt: null, lines: [...terminal.lines, `root@access:~$ ${raw}`, '[ABORT] sequence canceled.'] });
        return;
      }
    }

    if (lower === 'help') {
      const commands = catalog.filter((item) => unlocked.has(item.id)).map((item) => item.command).join(', ') || 'phish';
      append(`[HELP] unlocked commands: ${commands}`);
      return;
    }

    if (lower === 'load-gitconfig pulse') {
      if (!unlocked.has('load-gitconfig-pulse')) {
        append('[LOCKED] buy and complete lesson: load-gitconfig-pulse');
        return;
      }
      onTerminalUpdate({ ...terminal, input: '', awaitingPrompt: 'git-open', lines: [...terminal.lines, `root@access:~$ ${raw}`, 'Open directory Gitconfig PULSE? yes/no'] });
      return;
    }

    const command = catalog.find((item) => item.command === lower);
    if (!command) {
      append('[ERR] command not found. type `help`.');
      return;
    }

    if (!unlocked.has(command.id)) {
      append(`[LOCKED] ${command.title} requires lesson unlock from Black Market.`);
      return;
    }

    const now = Date.now();
    const cooldownUntil = terminal.cooldowns[command.id] ?? 0;
    if (cooldownUntil > now) {
      const sec = Math.ceil((cooldownUntil - now) / 1000);
      append(`[CD] ${command.command} available in ${sec}s.`);
      return;
    }

    try {
      onTerminalUpdate({ ...terminal, busy: true, input: '', lines: [...terminal.lines, `root@access:~$ ${raw}`, '[NET] executing server authority call...'] });
      const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const response = await executeCommand({ commandId: command.id, nonce, args: [] });
      const reward = response.reward ?? command.minReward;
      const xp = response.xp ?? command.xpReward;
      onTerminalUpdate({
        ...terminal,
        busy: false,
        input: '',
        cooldowns: { ...terminal.cooldowns, [command.id]: now + (response.cooldownSec ?? command.cooldownSec) * 1000 },
        lines: [...terminal.lines, `root@access:~$ ${raw}`, `[OK] success +Ø${reward} +XP${xp}`],
      });
    } catch {
      const reward = randomInt(command.minReward, command.maxReward);
      const xp = command.xpReward;
      onTerminalUpdate({
        ...terminal,
        busy: false,
        input: '',
        cooldowns: { ...terminal.cooldowns, [command.id]: now + command.cooldownSec * 1000 },
        lines: [...terminal.lines, `root@access:~$ ${raw}`, `[SIM] offline fallback +Ø${reward} +XP${xp}`],
      });
    }
  };

  return (
    <div className="panel terminal">
      <div className="terminal-log">
        {terminal.lines.slice(-12).map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
      <div className="terminal-input-row">
        <input
          value={terminal.input}
          onChange={(e) => onTerminalUpdate({ ...terminal, input: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runInput();
            }
          }}
          placeholder="Enter command"
          disabled={terminal.busy}
        />
        <button onClick={() => void runInput()} disabled={terminal.busy}>Run</button>
      </div>
      <p className="prompt">Wallet Ø{profile?.nops ?? 0} | Known commands: {unlocked.size}</p>
    </div>
  );
}

function BlackMarketPanel({ user, profile, catalog, lessonProgress }: { user: User | null; profile: PlayerProfile | null; catalog: CommandCatalogItem[]; lessonProgress: LessonProgress[] }) {
  const completed = new Map(lessonProgress.map((item) => [item.commandId, item]));
  const [message, setMessage] = useState('Buy lessons to unlock commands in Index + Terminal.');

  const runLesson = async (commandId: string, cost: number) => {
    if (!user) return;
    if ((profile?.nops ?? 0) < cost) {
      setMessage(`[DENIED] requires Ø${cost}.`);
      return;
    }

    const trait = await completeLesson(user.uid, commandId);
    setMessage(trait ? `[RARITY] ${commandId} unlocked with SPRING trait (x5/x3)!` : `[OK] ${commandId} lesson completed.`);
  };

  return (
    <div className="panel">
      <h3>Black Market Lessons</h3>
      <p className="prompt">{message}</p>
      <ul className="market-list">
        {catalog.map((item) => {
          const lesson = completed.get(item.id);
          return (
            <li key={item.id}>
              <strong>{item.title}</strong> ({item.command}) • Ø{item.lessonCost} • lvl {item.requiredLevel}
              <div className="row-inline">
                <span>{lesson?.completed ? `Unlocked${lesson.trait ? ' • Trait: SPRING' : ''}` : 'Locked'}</span>
                <button disabled={Boolean(lesson?.completed)} onClick={() => void runLesson(item.id, item.lessonCost)}>
                  {lesson?.completed ? 'Completed' : 'Start lesson'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IndexPanel({ catalog, inventory, lessonProgress }: { catalog: CommandCatalogItem[]; inventory: PlayerInventoryItem[]; lessonProgress: LessonProgress[] }) {
  const unlocked = new Set<string>(['phish']);
  inventory.forEach((item) => unlocked.add(item.commandId));
  lessonProgress.filter((item) => item.completed).forEach((item) => unlocked.add(item.commandId));

  const traitMap = new Map<string, string>();
  inventory.filter((item) => item.trait).forEach((item) => traitMap.set(item.commandId, item.trait ?? ''));
  lessonProgress.filter((item) => item.trait).forEach((item) => traitMap.set(item.commandId, item.trait ?? ''));

  return (
    <div className="panel">
      <h3>Command Index</h3>
      <h4>Owned / Unlocked</h4>
      <ul>
        {catalog.filter((item) => unlocked.has(item.id)).map((item) => (
          <li key={item.id}>{item.command}{traitMap.get(item.id) ? `-TS (${traitMap.get(item.id)})` : ''}</li>
        ))}
      </ul>
      <h4>Locked</h4>
      <ul>
        {catalog.filter((item) => !unlocked.has(item.id)).map((item) => (
          <li key={item.id}>{item.command} — requires Ø{item.lessonCost} and level {item.requiredLevel}</li>
        ))}
      </ul>
    </div>
  );
}

function BootSequence({ onDone }: { onDone: () => void }) {
  useEffect(() => { onDone(); }, [onDone]);
  return (
    <section className="boot-screen">
      <CyberBackground />
      <div className="binary-rain" aria-hidden>{'101001001011010100101010101001100100101'.repeat(9)}</div>
      <div className="boot-text"><h1>ROOTACCESS</h1><p>linking ghost nodes . . .</p></div>
    </section>
  );
}

function LoadingShell() {
  return (
    <section className="login-shell">
      <CyberBackground />
      <div className="desktop-overlay" />
      <div className="login-card"><h2>Authenticating Session</h2><p>Syncing profile + role flags...</p></div>
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
            if (mode === 'signin') await loginWithEmail(email, password);
            else await registerWithEmail(email, password);
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
        <button type="button" onClick={() => setMode((prev) => (prev === 'signin' ? 'register' : 'signin'))}>{mode === 'signin' ? 'Need an account?' : 'Already have an account?'}</button>
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}

function PanelList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
