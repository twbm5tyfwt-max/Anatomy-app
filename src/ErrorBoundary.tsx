import { Component, type ReactNode } from "react";

/** A crash in one screen shouldn't leave a blank page. Saved work lives in the browser, untouched. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 520, margin: "12vh auto", padding: 24, font: "16px/1.5 system-ui" }}>
        <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
        <p>
          Your notes, study tabs, flashcards and scores are saved on this device and weren't affected.
          Reload to carry on.
        </p>
        <p style={{ opacity: 0.7, fontSize: 13 }}>{this.state.error.message}</p>
        <button onClick={() => location.reload()} style={{ padding: "10px 20px", fontSize: 16 }}>
          Reload
        </button>
      </div>
    );
  }
}
