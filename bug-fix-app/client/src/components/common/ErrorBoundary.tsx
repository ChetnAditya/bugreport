import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface State { hasError: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: Error) {
    console.error('UI error:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-xl px-6 py-24">
          <h1 className="font-display text-2xl mb-2">Something went wrong</h1>
          <p className="text-secondary mb-4">An unexpected error occurred. Try refreshing.</p>
          <Link to="/dashboard" className="text-accent underline">Back to dashboard</Link>
        </main>
      );
    }
    return this.props.children;
  }
}
