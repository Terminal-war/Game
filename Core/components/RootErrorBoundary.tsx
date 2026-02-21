import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getBootEvents, logBoot } from '../runtime/diagnostics';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class RootErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logBoot('runtime', 'Root runtime failure captured by boundary.', 'error', {
      message: error.message,
      stack: info.componentStack,
    });
    console.error('Root runtime failure:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const events = getBootEvents().slice(-6);

    return (
      <main style={{ width: '100vw', height: '100vh', background: '#04080f', color: '#d8fff5', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        <section style={{ maxWidth: 760, border: '1px solid rgba(117,255,236,0.4)', borderRadius: 12, padding: 16, background: 'rgba(4,18,28,0.9)' }}>
          <h1>RootAccess recovered from a runtime error</h1>
          <p>Reload the page. If the error persists, inspect the boot diagnostics below and browser console logs.</p>
          <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.8 }}>{this.state.message}</pre>
          {events.length > 0 ? (
            <div>
              <h2 style={{ fontSize: '1rem' }}>Boot diagnostics</h2>
              <ul>
                {events.map((event) => (
                  <li key={`${event.at}-${event.stage}-${event.message}`}>
                    [{event.level}] {event.stage}: {event.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </main>
    );
  }
}
