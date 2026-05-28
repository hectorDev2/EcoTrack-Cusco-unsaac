'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-status-alert/5 rounded-xl border border-status-alert/20">
          <span className="material-symbols-outlined text-[48px] text-status-alert mb-4">error</span>
          <h2 className="text-[20px] font-bold text-on-surface mb-2">Algo salió mal</h2>
          <p className="text-[14px] text-on-surface-variant text-center mb-4 max-w-md">
            {this.state.error?.message ?? 'Error desconocido'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
