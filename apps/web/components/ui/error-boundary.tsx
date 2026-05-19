"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
            <h2 className="text-lg font-bold text-red-800 mb-2">页面渲染错误</h2>
            <p className="text-sm text-red-600 mb-4 font-mono bg-red-100/50 p-2 rounded">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
              className="inline-flex items-center justify-center rounded-md bg-white border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
