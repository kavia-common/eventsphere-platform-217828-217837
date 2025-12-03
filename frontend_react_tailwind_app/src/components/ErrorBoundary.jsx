import React from 'react';

/**
 * PUBLIC_INTERFACE
 * ErrorBoundary component that catches rendering errors in its child tree and displays a friendly fallback UI.
 * - Props:
 *    - fallback?: React.ReactNode optional custom fallback node
 *    - onReset?: () => void optional callback when user clicks "Try again"
 *    - children: React.ReactNode normal children to render
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset() {
    this.setState({ error: null });
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (e) {
        // no-op
      }
    }
  }

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;

    if (error) {
      if (fallback) return fallback;
      return (
        <div className="p-6">
          <div className="rounded-lg border border-gray-200 bg-white shadow-soft p-6">
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong.</h2>
            <p className="mt-2 text-sm text-gray-600">
              An unexpected error occurred while rendering this section.
            </p>
            <pre className="mt-3 text-xs text-red-600 overflow-auto">
              {String(error?.message || error)}
            </pre>
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={this.handleReset}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
