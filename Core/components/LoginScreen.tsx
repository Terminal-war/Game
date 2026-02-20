import { useState, type FormEvent } from 'react';

type LoginMode = 'signin' | 'register';

export function LoginScreen({
  onSignIn,
  onRegister,
  loading,
  error,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, handle: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [mode, setMode] = useState<LoginMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      await onSignIn(email, password);
      return;
    }
    await onRegister(email, password, handle);
  };

  return (
    <section className="login-screen">
      <div className="login-panel">
        <img src="Gui/Images/symbol_02.png" alt="terminal icon" className="login-icon" />
        <h2>ACCESS TERMINAL</h2>
        <p>Authenticate to unlock RootAccess desktop runtime.</p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Neural_ID" required />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Decrypt-Key" required />

          <button type="submit" disabled={loading}>{loading ? 'Syncing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
        </form>

        <button className="ghost-btn" onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}>
          {mode === 'signin' ? 'Need an account? Register' : 'Have access credentials? Sign in'}
        </button>

        {error && <p className="error">{error}</p>}
      </div>
    </section>
  );
}
