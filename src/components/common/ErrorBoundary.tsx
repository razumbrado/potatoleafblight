import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('BlightVision encountered an unexpected error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <p className="mt-3 break-words rounded-xl bg-subtle p-3 text-left font-mono text-xs text-ink-muted">
            {this.state.error.message}
          </p>
          <Button className="mt-6" icon={<RefreshCw className="h-4 w-4" />} onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
