// Catches any render error so the app shows a recovery screen instead of a blank white page.
// The most common cause is stale persisted state; the recovery button clears it and reloads.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearState } from './persistence';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App crashed:', error, info);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="app">
        <section className="panel">
          <h2>Something went wrong</h2>
          <p className="hint">
            The app hit an error while rendering — most often a saved game from an older version.
            Clearing the saved data and reloading usually fixes it.
          </p>
          <pre className="crash-detail">{String(error.message || error)}</pre>
          <button
            className="confirm-btn"
            onClick={() => {
              clearState();
              location.reload();
            }}
          >
            Clear saved data &amp; reload
          </button>
        </section>
      </div>
    );
  }
}
