import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import './firebase';
import { CyberBackground } from './components/CyberBackground';
import { playHover, playOpen } from './audio';
import { ROOT_APPS, type RootAppId } from './appRegistry';
import { loginWithEmail, logout, registerWithEmail, watchAuth } from './services/auth';
import { playCasinoRound } from './services/casino';
import { executeCommand } from './services/gameActions';
import { completeLesson, watchCasinoBadges, watchCommandCatalog, watchLessonProgress, watchPlayerInventory } from './services/market';
import { watchPortfolio, watchStockMarket } from './services/blockchain';
import { joinPvpQueue, leavePvpQueue, watchPvpQueue } from './services/pvp';
import { ensurePlayerProfile, watchPlayerProfile } from './services/profile';
import type { CasinoBadge, CasinoRoundResult, CommandCatalogItem, LessonProgress, PlayerInventoryItem, PlayerProfile, PvpQueueTicket, StockCompany, StockHolding } from './types/domain';

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
  awaitingPrompt: null | 'git-open';
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
  const [casinoBadges, setCasinoBadges] = useState<CasinoBadge[]>([]);
  const [stocks, setStocks] = useState<StockCompany[]>([]);
  const [portfolio, setPortfolio] = useState<StockHolding[]>([]);
  const [pvpQueue, setPvpQueue] = useState<PvpQueueTicket[]>([]);
  const [terminal, setTerminal] = useState<TerminalState>(initialTerminal);

  const topZ = useMemo(() => Math.max(...windows.map((w) => w.z)), [windows]);

  useEffect(() => {
    let unwatchProfile: (() => void) | undefined;
    let unwatchInventory: (() => void) | undefined;
    let unwatchLessons: (() => void) | undefined;
    let unwatchBadges: (() => void) | undefined;
    let unwatchPortfolio: (() => void) | undefined;

    const unsubscribeCatalog = watchCommandCatalog(setCatalog);
    const unsubscribeStocks = watchStockMarket(setStocks);
    const unsubscribePvpQueue = watchPvpQueue(setPvpQueue);
    const unsubscribeAuth = watchAuth((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        unwatchProfile?.();
        unwatchInventory?.();
        unwatchLessons?.();
        unwatchBadges?.();
        unwatchPortfolio?.();
        unwatchProfile = undefined;
        unwatchInventory = undefined;
        unwatchLessons = undefined;
        unwatchBadges = undefined;
        unwatchPortfolio = undefined;
        setProfile(null);
        setInventory([]);
        setLessonProgress([]);
        setCasinoBadges([]);
        setPortfolio([]);
        setSession('login');
        return;
      }

      ensurePlayerProfile(nextUser).catch(() => undefined);
      unwatchProfile?.();
      unwatchInventory?.();
      unwatchLessons?.();
      unwatchBadges?.();
      unwatchPortfolio?.();
      unwatchProfile = watchPlayerProfile(nextUser.uid, (nextProfile) => {
        setProfile(nextProfile);
        setSession('desktop');
      });
      unwatchInventory = watchPlayerInventory(nextUser.uid, setInventory);
      unwatchLessons = watchLessonProgress(nextUser.uid, setLessonProgress);
      unwatchBadges = watchCasinoBadges(nextUser.uid, setCasinoBadges);
      unwatchPortfolio = watchPortfolio(nextUser.uid, setPortfolio);
    });

    return () => {
      unwatchProfile?.();
      unwatchInventory?.();
      unwatchLessons?.();
      unwatchBadges?.();
      unwatchPortfolio?.();
      unsubscribeCatalog();
      unsubscribeStocks();
      unsubscribePvpQueue();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (session !== 'auth-loading' || user) return;
    const timeout = window.setTimeout(() => setSession('login'), 2500);
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
      onPointerMove={(event) => {
        if (!dragging) return;
        setWindows((state) =>
          state.map((win) => {
            if (win.id !== dragging.id || win.maximized) return win;
            const maxX = Math.max(0, window.innerWidth - 240);
            const maxY = Math.max(24, window.innerHeight - 120);
            return {
              ...win,
              x: Math.max(0, Math.min(maxX, event.clientX - dragging.dx)),
              y: Math.max(24, Math.min(maxY, event.clientY - dragging.dy)),
            };
          }),
        );
      }}
      onPointerUp={() => setDragging(null)}
    >
      <CyberBackground />
      <div className="desktop-overlay" />
      <header className="desktop-top">ROOTACCESS // PHASE 6 + 7</header>
      <div className="status-chip">
        <span>{user?.email ?? 'anonymous'}</span>
        {isAdmin ? <span className="pill">ADMIN</span> : null}
        {isBanned ? <span className="pill warning">BANNED</span> : null}
        <button onClick={() => logout()}>Sign out</button>
      </div>

      {!isBanned
        ? windows.map((win) => {
            const app = ROOT_APPS.find((candidate) => candidate.id === win.id);
            if (!app || (app.lockedToAdmin && !isAdmin) || win.minimized) return null;

            return (
              <section
                key={win.id}
                className="window"
                style={
                  win.maximized
                    ? { inset: '48px 20px 86px', zIndex: win.z }
                    : {
                        left: win.x,
                        top: win.y,
                        width: Math.max(MIN_W, win.w),
                        height: Math.max(MIN_H, win.h),
                        zIndex: win.z,
                      }
                }
                onPointerDown={() => focusWindow(win.id)}
              >
                <div
                  className="window-bar"
                  onPointerDown={(event) => {
                    if (win.maximized) return;
                    const rect = (event.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                    setDragging({ id: win.id, dx: event.clientX - rect.left, dy: event.clientY - rect.top });
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
                    casinoBadges={casinoBadges}
                    stocks={stocks}
                    portfolio={portfolio}
                    pvpQueue={pvpQueue}
                    terminal={terminal}
                    onTerminalUpdate={setTerminal}
                  />
                </div>
              </section>
            );
          })
        : <div className="panel banned-screen">Your account is currently banned. Contact support.</div>}

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
  casinoBadges,
  stocks,
  portfolio,
  pvpQueue,
  terminal,
  onTerminalUpdate,
}: {
  appId: RootAppId;
  profile: PlayerProfile | null;
  user: User | null;
  catalog: CommandCatalogItem[];
  inventory: PlayerInventoryItem[];
  lessonProgress: LessonProgress[];
  casinoBadges: CasinoBadge[];
  stocks: StockCompany[];
  portfolio: StockHolding[];
  pvpQueue: PvpQueueTicket[];
  terminal: TerminalState;
  onTerminalUpdate: Dispatch<SetStateAction<TerminalState>>;
}) {
  switch (appId) {
    case 'terminal':
      return (
        <TerminalPanel
          terminal={terminal}
          onTerminalUpdate={onTerminalUpdate}
          profile={profile}
          catalog={catalog}
          inventory={inventory}
          lessonProgress={lessonProgress}
        />
      );
    case 'black-market':
      return <BlackMarketPanel user={user} profile={profile} catalog={catalog} lessonProgress={lessonProgress} />;
    case 'casino':
      return <CasinoPanel profile={profile} badges={casinoBadges} />;
    case 'blockchain':
      return <BlockchainPanel stocks={stocks} portfolio={portfolio} />;
    case 'pvp':
      return <PvpPanel user={user} profile={profile} queue={pvpQueue} />;
    case 'index':
      return <IndexPanel catalog={catalog} inventory={inventory} lessonProgress={lessonProgress} />;
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
    case 'settings':
      return <PanelList title="Settings" items={['SFX volume', 'Graphics quality', 'Motion intensity']} />;
    case 'admin':
      return <PanelList title="Admin" items={['Global event controls', 'Shop config', 'Moderation logs']} />;
    default:
      return null;
  }
}

function TerminalPanel({
  terminal,
  onTerminalUpdate,
  profile,
  catalog,
  inventory,
  lessonProgress,
}: {
  terminal: TerminalState;
  onTerminalUpdate: Dispatch<SetStateAction<TerminalState>>;
  profile: PlayerProfile | null;
  catalog: CommandCatalogItem[];
  inventory: PlayerInventoryItem[];
  lessonProgress: LessonProgress[];
}) {
  const unlocked = new Set<string>(['phish']);
  inventory.forEach((item) => unlocked.add(item.commandId));
  lessonProgress.filter((item) => item.completed).forEach((item) => unlocked.add(item.commandId));

  const addLines = (...lines: string[]) => {
    onTerminalUpdate((prev) => ({ ...prev, lines: [...prev.lines, ...lines] }));
  };

  const runInput = async () => {
    const raw = terminal.input.trim();
    if (!raw) return;
    const lower = raw.toLowerCase();

    onTerminalUpdate((prev) => ({ ...prev, input: '', lines: [...prev.lines, `root@access:~$ ${raw}`] }));

    if (terminal.awaitingPrompt === 'git-open') {
      if (lower === 'yes') {
        onTerminalUpdate((prev) => ({
          ...prev,
          awaitingPrompt: null,
          lines: [...prev.lines, 'Open directory Gitconfig PULSE? yes/no', 'Yes/>< Brute Force', '[TRACE] Brute forcing subkeys... complete. +Ø42'],
        }));
        return;
      }

      onTerminalUpdate((prev) => ({ ...prev, awaitingPrompt: null, lines: [...prev.lines, '[ABORT] sequence canceled.'] }));
      return;
    }

    if (lower === 'help') {
      const commands = catalog.filter((item) => unlocked.has(item.id)).map((item) => item.command).join(', ') || 'phish';
      addLines(`[HELP] unlocked commands: ${commands}`);
      return;
    }

    if (lower === 'load-gitconfig pulse') {
      if (!unlocked.has('load-gitconfig-pulse')) {
        addLines('[LOCKED] buy and complete lesson: load-gitconfig-pulse');
        return;
      }

      onTerminalUpdate((prev) => ({ ...prev, awaitingPrompt: 'git-open', lines: [...prev.lines, 'Open directory Gitconfig PULSE? yes/no'] }));
      return;
    }

    const command = catalog.find((item) => item.command === lower);
    if (!command) {
      addLines('[ERR] command not found. type `help`.');
      return;
    }

    if (!unlocked.has(command.id)) {
      addLines(`[LOCKED] ${command.title} requires lesson unlock from Black Market.`);
      return;
    }

    const now = Date.now();
    const cooldownUntil = terminal.cooldowns[command.id] ?? 0;
    if (cooldownUntil > now) {
      const sec = Math.ceil((cooldownUntil - now) / 1000);
      addLines(`[CD] ${command.command} available in ${sec}s.`);
      return;
    }

    onTerminalUpdate((prev) => ({ ...prev, busy: true, lines: [...prev.lines, '[NET] executing server authority call...'] }));

    try {
      const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const response = await executeCommand({ commandId: command.id, nonce, args: [] });
      const reward = response.reward ?? command.minReward;
      const xp = response.xp ?? command.xpReward;
      const cooldownMs = (response.cooldownSec ?? command.cooldownSec) * 1000;
      onTerminalUpdate((prev) => ({
        ...prev,
        busy: false,
        cooldowns: { ...prev.cooldowns, [command.id]: Date.now() + cooldownMs },
        lines: [...prev.lines, `[OK] success +Ø${reward} +XP${xp}`],
      }));
    } catch {
      const reward = randomInt(command.minReward, command.maxReward);
      onTerminalUpdate((prev) => ({
        ...prev,
        busy: false,
        cooldowns: { ...prev.cooldowns, [command.id]: Date.now() + command.cooldownSec * 1000 },
        lines: [...prev.lines, `[SIM] fallback +Ø${reward} +XP${command.xpReward}`],
      }));
    }
  };

  return (
    <div className="panel terminal">
      <div className="terminal-log">
        {terminal.lines.slice(-14).map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
      <div className="terminal-input-row">
        <input
          value={terminal.input}
          onChange={(event) => onTerminalUpdate((prev) => ({ ...prev, input: event.target.value }))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
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

    try {
      const trait = await completeLesson(user.uid, commandId);
      setMessage(trait ? `[RARITY] ${commandId} unlocked with SPRING trait (x5/x3)!` : `[OK] ${commandId} lesson completed.`);
    } catch (error) {
      setMessage(error instanceof Error ? `[ERR] ${error.message}` : '[ERR] lesson failed');
    }
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

function CasinoPanel({ profile, badges }: { profile: PlayerProfile | null; badges: CasinoBadge[] }) {
  const [betNops, setBetNops] = useState(10);
  const [result, setResult] = useState<CasinoRoundResult | null>(null);
  const [status, setStatus] = useState('Roll your luck for Ø and Flux.');
  const [busy, setBusy] = useState(false);

  const runRound = async () => {
    if (betNops <= 0) {
      setStatus('Bet must be positive.');
      return;
    }

    if ((profile?.nops ?? 0) < betNops) {
      setStatus('Not enough Ø for this bet.');
      return;
    }

    setBusy(true);
    try {
      const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const response = await playCasinoRound({ betNops, game: 'slots', nonce });
      setResult(response);
      setStatus(response.won ? `WIN +Ø${response.netNops}` : `LOSS Ø${Math.abs(response.netNops)}`);
    } catch {
      const won = Math.random() < 0.42;
      const net = won ? betNops : -betNops;
      const fallback: CasinoRoundResult = {
        won,
        payoutNops: won ? betNops * 2 : 0,
        netNops: net,
        fluxAwarded: won ? 1 : 0,
        streak: won ? 1 : 0,
        oddsLabel: 'fallback-42%',
      };
      setResult(fallback);
      setStatus(won ? `SIM WIN +Ø${fallback.netNops}` : `SIM LOSS Ø${Math.abs(fallback.netNops)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h3>Casino // Neon Oasis</h3>
      <p className="prompt">{status}</p>
      <div className="row-inline">
        <span>Bet Ø</span>
        <input type="number" min={1} value={betNops} onChange={(event) => setBetNops(Number(event.target.value))} />
        <button disabled={busy} onClick={() => void runRound()}>{busy ? 'Rolling...' : 'Play round'}</button>
      </div>
      <p>Wallet Ø{profile?.nops ?? 0} • Flux ƒ{profile?.flux ?? 0}</p>
      {result ? <p>{result.won ? 'WIN' : 'LOSS'} • Odds: {result.oddsLabel} • Flux +ƒ{result.fluxAwarded} • Streak {result.streak}</p> : null}
      <h4>Casino badges ({badges.length})</h4>
      <ul>
        {badges.length > 0
          ? badges.map((badge) => <li key={badge.badgeId}>{badge.name} • Streak {badge.streakRequired} • +ƒ{badge.fluxAwarded}</li>)
          : <li>No badges yet.</li>}
      </ul>
    </div>
  );
}


function BlockchainPanel({ stocks, portfolio }: { stocks: StockCompany[]; portfolio: StockHolding[] }) {
  const holdings = new Map(portfolio.map((item) => [item.stockId, item]));

  return (
    <div className="panel">
      <h3>Block Chain Market</h3>
      <p className="prompt">Live trend board for VALK / GLYPH / ZERO / PULSE / TITAN.</p>
      <div className="stock-grid">
        {stocks.map((stock) => {
          const mine = holdings.get(stock.id);
          const trendClass = stock.trend === 'up' ? 'trend-up' : stock.trend === 'down' ? 'trend-down' : 'trend-flat';
          return (
            <article key={stock.id} className="stock-card">
              <header>
                <strong>{stock.ticker}</strong>
                <span>{stock.name}</span>
              </header>
              <p>Price Ø{stock.price}</p>
              <p className={trendClass}>Trend: {stock.trend}</p>
              <p>Market shares: {stock.availableShares}/100</p>
              <p>Your shares: {mine?.shares ?? 0}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PvpPanel({ user, profile, queue }: { user: User | null; profile: PlayerProfile | null; queue: PvpQueueTicket[] }) {
  const [busy, setBusy] = useState(false);
  const inQueue = Boolean(user && queue.some((ticket) => ticket.uid === user.uid));

  const toggleQueue = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (inQueue) await leavePvpQueue(user.uid);
      else await joinPvpQueue(user.uid, profile?.displayName ?? user.email ?? 'Operator');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h3>PvP Queue // Inferno Grid</h3>
      <p className="prompt">Queue with another operator and race shard ratio for ranked points.</p>
      <button onClick={() => void toggleQueue()} disabled={busy}>
        {busy ? 'Syncing...' : inQueue ? 'Leave Queue' : 'Join Queue'}
      </button>
      <h4>Live queue ({queue.length})</h4>
      <ul>
        {queue.length > 0
          ? queue.map((ticket) => (
              <li key={ticket.id}>
                {ticket.displayName} • {ticket.status} • shards {ticket.score} • ratio {ticket.shardRatio}
              </li>
            ))
          : <li>No operators queued.</li>}
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
  useEffect(() => {
    onDone();
  }, [onDone]);

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
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          const formData = new FormData(event.currentTarget);
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
