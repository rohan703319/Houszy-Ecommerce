"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console or error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/admin";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white mb-3">
                Oops! Something went wrong
              </h1>

              {/* Description */}
              <p className="text-slate-400 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe. 
                Please try refreshing the page or go back to the dashboard.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <p className="text-xs font-mono text-red-400 mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-slate-500 mt-2 overflow-auto max-h-64">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white rounded-lg font-medium shadow-lg transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-slate-500 mt-6 text-center">
                If the problem persists, please contact support at{" "}
                <a href="mailto:support@yourapp.com" className="text-cyan-400 hover:underline">
                  support@yourapp.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
