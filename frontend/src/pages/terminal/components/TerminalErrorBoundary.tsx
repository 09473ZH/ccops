import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  paneId: string;
  onReconnect?: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TerminalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[TerminalPane ${this.props.paneId}] crashed:`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReconnect?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black/80 text-gray-400">
          <p className="text-sm">终端面板发生错误</p>
          <p className="max-w-[300px] truncate text-xs text-gray-600">
            {this.state.error?.message}
          </p>
          <button
            className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-gray-600"
            onClick={this.handleRetry}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
