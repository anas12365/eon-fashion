import { Component } from 'react';

// Phase 6.1 — top-level safety net, still wrapping <App/> in main.jsx as
// the last line of defense. An uncaught error anywhere below it shows a
// plain full-page fallback instead of a blank white screen.
//
// Phase 6.3 — this same component now also supports a lighter-weight
// `variant="section"` for nested boundaries (see App.jsx, AdminLayout.jsx).
// The idea: one broken page/widget shouldn't take out navigation, the
// cart, or the rest of the admin dashboard along with it — only the
// section that actually failed shows a contained message, with a way to
// retry without a full page reload. `resetKey` lets a parent clear a
// tripped boundary automatically (e.g. on route change) so navigating
// away from the broken page and back doesn't require the retry click.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const label = this.props.label ? ` (${this.props.label})` : '';
    // eslint-disable-next-line no-console
    console.error(`Unhandled error caught by ErrorBoundary${label}:`, error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ hasError: false });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.variant === 'section') {
      return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center font-body text-[#0A0A0B]">
          <p className="text-sm text-black/50">
            {this.props.label
              ? `This ${this.props.label} couldn't load.`
              : "This section couldn't load."}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-sm text-black/70 underline hover:text-black"
          >
            Try again
          </button>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F5F4] px-6 text-center font-body text-[#0A0A0B]">
        <p className="text-sm uppercase tracking-[0.2em] text-black/40">EON Fashion</p>
        <h1 className="text-2xl font-medium">Something went wrong.</h1>
        <p className="max-w-sm text-sm text-black/50">
          An unexpected error occurred. Reloading the page usually fixes this.
        </p>
        <button
          onClick={this.handleReload}
          className="mt-2 rounded-md bg-black px-5 py-3 text-sm text-white hover:opacity-90"
        >
          Reload
        </button>
      </div>
    );
  }
}
