'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-redwood-danger/10">
            <AlertTriangle className="h-6 w-6 text-redwood-danger" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-redwood-text mb-1">
              Algo salió mal
            </h3>
            {this.state.message && (
              <p className="text-sm text-redwood-muted max-w-md">{this.state.message}</p>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-redwood-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
