import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (this.state.failed) return (
      <div className="empty">
        <h3>Could not display this page</h3>
        <button className="btn primary" onClick={() => location.reload()}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}
