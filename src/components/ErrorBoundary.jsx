import { Component } from "react";

/**
 * ErrorBoundary — catches render errors so a broken widget
 * never takes down the whole page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{
            padding: "2rem", textAlign: "center",
            fontFamily: "system-ui, sans-serif", color: "#555"
          }}>
            <p>Something went wrong loading this section.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: "1rem", padding: "0.5rem 1.5rem",
                background: "#198754", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer"
              }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
