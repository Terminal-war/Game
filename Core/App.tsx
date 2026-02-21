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
type AppId = 'terminal' | 'profile' | 'market' | 'index' | 'casino' | 'blockchain' | 'pvp';
type Ticker = 'VALK' | 'GLYPH' | 'ZERO' | 'PULSE' | 'TITAN';

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

type Stock = { ticker: Ticker; name: string; price: number; drift: number; owned: number };
type MatchState = 'idle' | 'queued' | 'ready-check' | 'active' | 'result';

const initialWindows: WindowDef[] = [
  { id: 'terminal', title: 'Terminal', icon: 'Gui/Images/Icon01.png', x: 70, y: 70, w: 560, h: 360, minimized: false, z: 4 },
  { id: 'profile', title: 'Profile', icon: 'Gui/Images/Icon02.png', x: 160, y: 420, w: 400, h: 260, minimized: true, z: 2 },
  { id: 'market', title: 'Black Market', icon: 'Gui/Images/Icon03.png', x: 680, y: 70, w: 460, h: 300, minimized: false, z: 3 },
  { id: 'index', title: 'Index', icon: 'Gui/Images/IconD09.png', x: 650, y: 390, w: 460, h: 300, minimized: true, z: 2 },
  { id: 'casino', title: 'Casino', icon: 'Gui/Images/IconD12.png', x: 1130, y: 90, w: 380, h: 300, minimized: false, z: 3 },
  { id: 'blockchain', title: 'Blockchain', icon: 'Gui/Images/IconD06.png', x: 540, y: 190, w: 560, h: 350, minimized: true, z: 2 },
  { id: 'pvp', title: 'PvP Arena', icon: 'Gui/Images/IconD14.png', x: 960, y: 420, w: 520, h: 280, minimized: true, z: 2 },
];

const BADGES: CasinoBadge[] = [
  { id: 'lucky-3', title: 'Luck 3', description: 'Win the casino game 3 times in a row.', fluxReward: 2 },
  { id: 'lucky-5', title: 'Luck 5', description: 'Win 5 spins in a row.', fluxReward: 4 },
  { id: 'lucky-10', title: 'Luck 10', description: 'Win 10 spins in a row.', fluxReward: 10 },
];

const START_STOCKS: Stock[] = [
  { ticker: 'VALK', name: 'VALK-YRIE', price: 420, drift: 1.08, owned: 0 },
  { ticker: 'GLYPH', name: 'MIND-GLYPH', price: 40, drift: 1.02, owned: 0 },
  { ticker: 'ZERO', name: 'ZERO-GEN', price: 85, drift: 1.03, owned: 0 },
  { ticker: 'PULSE', name: 'NEON-PULSE', price: 130, drift: 1.06, owned: 0 },
  { ticker: 'TITAN', name: 'TITAN-CORE', price: 700, drift: 1.09, owned: 0 },
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

  const [stocks, setStocks] = useState<Stock[]>(START_STOCKS);
  const [marketTick, setMarketTick] = useState(0);

  const [pvpState, setPvpState] = useState<MatchState>('idle');
  const [pvpTimer, setPvpTimer] = useState(0);
  const [myShards, setMyShards] = useState(0);
  const [enemyShards, setEnemyShards] = useState(0);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStocks((state) =>
        state.map((s) => {
          const pulse = Math.sin((Date.now() / 1200) * s.drift + s.price / 100) * 0.02;
          const random = (Math.random() - 0.5) * 0.03;
          const next = Math.max(5, Math.round(s.price * (1 + pulse + random)));
          return { ...s, price: next };
        }),
      );
      setMarketTick((tick) => tick + 1);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pvpState !== 'active') return;
    const timer = window.setInterval(() => {
      setPvpTimer((v) => v - 1);
      if (Math.random() < 0.42) setMyShards((s) => s + 1);
      if (Math.random() < 0.36) setEnemyShards((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pvpState]);

  useEffect(() => {
    if (pvpState !== 'active') return;
    if (pvpTimer > 0) return;

    const win = myShards >= enemyShards;
    setPvpState('result');
    if (profile) {
      const delta = win ? Math.max(8, Math.floor((profile.nop || 0) * 0.08)) : -Math.max(4, Math.floor((profile.nop || 0) * 0.03));
      setProfile({ ...profile, nop: Math.max(0, profile.nop + delta), xp: profile.xp + (win ? 18 : 7) });
      setTerminalLog((s) => [`[PVP] ${win ? 'Victory' : 'Defeat'} // ${delta >= 0 ? '+' : ''}Ø${delta}`, ...s]);
    }
  }, [pvpTimer, pvpState, myShards, enemyShards, profile]);

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
    if (ownedCommands.includes(commandId)) return;

    if (profile.nop < cmd.lessonCost) {
      setTerminalLog((s) => [`[DENY] Need Ø${cmd.lessonCost - profile.nop} more for ${commandId}.`, ...s]);
      return;
    }

    setOwnedCommands((state) => [...state, commandId]);
    setProfile({ ...profile, nop: profile.nop - cmd.lessonCost });
    setTerminalLog((s) => [`[UNLOCK] ${commandId} lesson complete.`, ...s]);
  };

  const playCasinoRound = (bet: number) => {
    if (!profile || bet <= 0 || profile.nop < bet) return;

    const win = Math.random() < 0.47;
    let nextProfile = { ...profile, nop: profile.nop - bet };

    if (win) {
      nextProfile = { ...nextProfile, nop: nextProfile.nop + bet * 2 };
      setCasinoStreak((streak) => {
        const next = streak + 1;
        grantBadges(next);
        return next;
      });
      setTerminalLog((s) => [`[CASINO-WIN] +Ø${bet}`, ...s]);
    } else {
      setCasinoStreak(0);
      setTerminalLog((s) => [`[CASINO-LOSS] -Ø${bet}`, ...s]);
    }

    setProfile(nextProfile);
  };

  const grantBadges = (streak: number) => {
    BADGES.forEach((badge, idx) => {
      const req = [3, 5, 10][idx];
      if (streak >= req && !badges.includes(badge.id)) {
        setBadges((state) => [...state, badge.id]);
        setProfile((prev) => (prev ? { ...prev, flux: prev.flux + badge.fluxReward } : prev));
        setTerminalLog((s) => [`[BADGE] ${badge.title} +ƒ${badge.fluxReward}`, ...s]);
      }
    });
  };

  const tradeShare = (ticker: Ticker, qty: number) => {
    if (!profile) return;
    const stock = stocks.find((s) => s.ticker === ticker);
    if (!stock) return;
    const cost = stock.price * Math.abs(qty);

    if (qty > 0 && profile.nop < cost) {
      setTerminalLog((s) => [`[CHAIN] insufficient Ø for ${ticker} x${qty}`, ...s]);
      return;
    }

    if (qty < 0 && stock.owned < Math.abs(qty)) {
      setTerminalLog((s) => [`[CHAIN] not enough ${ticker} shares to sell.`, ...s]);
      return;
    }

    setStocks((state) =>
      state.map((s) => (s.ticker === ticker ? { ...s, owned: Math.max(0, s.owned + qty) } : s)),
    );
    setProfile({ ...profile, nop: qty > 0 ? profile.nop - cost : profile.nop + cost });
    setTerminalLog((s) => [`[CHAIN] ${qty > 0 ? 'BUY' : 'SELL'} ${ticker} x${Math.abs(qty)} @ Ø${stock.price}`, ...s]);
  };

  const queuePvp = () => {
    if (pvpState !== 'idle' && pvpState !== 'result') return;
    setPvpState('queued');
    setTerminalLog((s) => ['[PVP] queued for match...', ...s]);
    window.setTimeout(() => setPvpState('ready-check'), 1500);
  };

  const startPvp = () => {
    setPvpState('active');
    setPvpTimer(20);
    setMyShards(0);
    setEnemyShards(0);
    setTerminalLog((s) => ['[PVP] match started. gather shards!', ...s]);
  };

  const resetPvp = () => setPvpState('idle');

  if (screen === 'boot') return <BootSequence onDone={() => setScreen(firebaseReady ? 'login' : 'desktop')} />;
  if (screen === 'login') return <LoginScreen onSignIn={signIn} onRegister={signUp} loading={authLoading} error={authError} />;

  return (
    <main
      className="desktop-root"
      onPointerMove={(e) => {
        if (!dragging) return;
        setWindows((state) => state.map((w) => (w.id === dragging.id ? { ...w, x: e.clientX - dragging.dx, y: e.clientY - dragging.dy } : w)));
      }}
      onPointerUp={() => setDragging(null)}
    >
      <CyberBackground />
      <div className="desktop-overlay" />
      <header className="desktop-top">
        ROOTACCESS // {profile?.handle ?? 'Operator'} // Ø{profile?.nop ?? 0} // ƒ{profile?.flux ?? 0} // LVL {profile?.level ?? 1}
      </header>
      {!firebaseReady && <div className="guest-banner">Guest mode active: configure Firebase env for cloud persistence.</div>}
      <button className="logout-btn" onClick={() => logout()}>Logout</button>

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
            {win.id === 'terminal' && <TerminalPanel log={terminalLog} onRunStarter={() => executeCommand(STARTER_COMMAND.id)} onRunOwned={(commandId) => executeCommand(commandId)} cooldownLeft={Math.ceil(cooldownLeft / 1000)} ownedCommands={ownedCommands} />}
            {win.id === 'profile' && <ProfilePanel profile={profile} badges={badges} streak={casinoStreak} />}
            {win.id === 'market' && <MarketPanel profile={profile} ownedCommands={ownedCommands} onBuyLesson={buyLesson} />}
            {win.id === 'index' && <IndexPanel ownedCommands={ownedCommands} missedCommands={missedCommands} />}
            {win.id === 'casino' && <CasinoPanel profile={profile} streak={casinoStreak} badges={badges} onBet={playCasinoRound} />}
            {win.id === 'blockchain' && <BlockchainPanel stocks={stocks} tick={marketTick} onTrade={tradeShare} profile={profile} />}
            {win.id === 'pvp' && <PvpPanel state={pvpState} timer={pvpTimer} myShards={myShards} enemyShards={enemyShards} onQueue={queuePvp} onReady={startPvp} onReset={resetPvp} />}
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

function lineFromResult(result: CommandResult) {
  if (result.reason === 'COOLDOWN') return '[WAIT] command cooldown active';
  if (result.ok) return `[OK] ${result.commandId} success +Ø${result.deltaNop} // trace ${result.traceId}`;
  return `[FAIL] ${result.commandId} tripped alarm Ø${result.deltaNop} // trace ${result.traceId}`;
}

function TerminalPanel({ log, onRunStarter, onRunOwned, cooldownLeft, ownedCommands }: { log: string[]; onRunStarter: () => Promise<void>; onRunOwned: (commandId: string) => Promise<void>; cooldownLeft: number; ownedCommands: string[]; }) {
  return <div className="panel terminal"><p className="prompt">Starter command: phish // cooldown {cooldownLeft}s</p><div className="terminal-controls"><button className="run-btn" onClick={() => onRunStarter()}>Run phish</button>{ownedCommands.filter((c) => c !== 'phish').map((cmd) => <button key={cmd} className="run-btn" onClick={() => onRunOwned(cmd)}>Run {cmd}</button>)}</div><div className="terminal-log">{log.map((line, i) => <p key={`${line}-${i}`}>{line}</p>)}</div></div>;
}

function ProfilePanel({ profile, badges, streak }: { profile: PlayerProfile | null; badges: string[]; streak: number }) {
  return <div className="panel"><img className="hero" src="Gui/Images/HeroCard.png" alt="avatar panel" /><p>Handle: {profile?.handle ?? 'Unknown'}</p><p>Level {profile?.level ?? 1} // XP {profile?.xp ?? 0}</p><p>Wallet: Ø {profile?.nop ?? 0} // ƒ {profile?.flux ?? 0}</p><p>Casino streak: {streak}</p><p>Badges: {badges.length ? badges.join(', ') : 'None yet'}</p></div>;
}

function MarketPanel({ profile, ownedCommands, onBuyLesson }: { profile: PlayerProfile | null; ownedCommands: string[]; onBuyLesson: (commandId: string) => void; }) {
  return <div className="panel"><p>Black Market // wallet Ø{profile?.nop ?? 0}</p><ul className="shop-list">{COMMAND_CATALOG.filter((cmd) => cmd.lessonCost > 0).map((cmd) => <li key={cmd.id}><div><strong>{cmd.label}</strong><p>Lesson Ø{cmd.lessonCost} // Req Lv {cmd.requiredLevel}</p></div><button className="run-btn" disabled={ownedCommands.includes(cmd.id)} onClick={() => onBuyLesson(cmd.id)}>{ownedCommands.includes(cmd.id) ? 'Owned' : 'Buy Lesson'}</button></li>)}</ul></div>;
}

function IndexPanel({ ownedCommands, missedCommands }: { ownedCommands: string[]; missedCommands: string[] }) {
  const locked = COMMAND_CATALOG.map((c) => c.id).filter((id) => !ownedCommands.includes(id));
  return <div className="panel index-grid"><div><h4>Owned Commands</h4><ul>{ownedCommands.map((c) => <li key={c}>{c}</li>)}</ul></div><div><h4>Locked Commands</h4><ul>{locked.map((c) => <li key={c}>{c}</li>)}</ul></div><div><h4>Missed Limiteds</h4><ul>{missedCommands.map((m) => <li key={m}>{m}</li>)}</ul></div></div>;
}

function CasinoPanel({ profile, streak, badges, onBet }: { profile: PlayerProfile | null; streak: number; badges: string[]; onBet: (bet: number) => void; }) {
  return <div className="panel casino-panel"><p>Neon Pulse Casino // Wallet Ø{profile?.nop ?? 0} // Flux ƒ{profile?.flux ?? 0}</p><p>Current streak: {streak}</p><div className="casino-actions">{[5, 10, 25].map((bet) => <button key={bet} className="run-btn" onClick={() => onBet(bet)}>Bet Ø{bet}</button>)}</div><h4>Badge Track</h4><ul>{BADGES.map((b) => <li key={b.id}>{badges.includes(b.id) ? '✅' : '⬜'} {b.title} — {b.description} (+ƒ{b.fluxReward})</li>)}</ul></div>;
}

function BlockchainPanel({ stocks, tick, onTrade, profile }: { stocks: Stock[]; tick: number; onTrade: (ticker: Ticker, qty: number) => void; profile: PlayerProfile | null; }) {
  const portfolio = stocks.reduce((sum, s) => sum + s.price * s.owned, 0);
  return <div className="panel"><p>Block Chain // tick {tick} // wallet Ø{profile?.nop ?? 0} // portfolio Ø{portfolio}</p><div className="stock-grid">{stocks.map((s) => <article key={s.ticker} className="stock-card"><h4>{s.name} <span>${s.ticker}</span></h4><p>Price Ø{s.price} // Owned {s.owned}</p><div className="stock-actions"><button className="run-btn" onClick={() => onTrade(s.ticker, 1)}>Buy 1</button><button className="run-btn" onClick={() => onTrade(s.ticker, -1)}>Sell 1</button></div></article>)}</div></div>;
}

function PvpPanel({ state, timer, myShards, enemyShards, onQueue, onReady, onReset }: { state: MatchState; timer: number; myShards: number; enemyShards: number; onQueue: () => void; onReady: () => void; onReset: () => void; }) {
  return <div className="panel pvp-panel"><p>PvP Arena status: {state}</p><p>Timer: {timer}s // You {myShards} shards // Opponent {enemyShards} shards</p><div className="casino-actions">{state === 'idle' || state === 'result' ? <button className="run-btn" onClick={onQueue}>Queue</button> : null}{state === 'ready-check' ? <button className="run-btn" onClick={onReady}>Ready</button> : null}{state === 'result' ? <button className="run-btn" onClick={onReset}>Reset</button> : null}</div><p className="prompt">Goal: complete more successful hacks to earn shards and win payout.</p></div>;
}
