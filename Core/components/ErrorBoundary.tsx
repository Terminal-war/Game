import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('RootAccess runtime crash:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-screen">
          <section className="fatal-card">
            <h1>ROOTACCESS RECOVERY MODE</h1>
            <p>The UI crashed before rendering completely. Refresh and verify env config.</p>
            <code>{this.state.message}</code>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
