import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#08090d',
          color: '#e2e8f0',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#f43f5e', fontSize: '1.5rem', marginBottom: '1rem' }}>
            ❌ App Crash Detected
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>The following error caused a blank screen:</p>
          <pre style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '1.5rem',
            maxWidth: '900px',
            width: '100%',
            overflowX: 'auto',
            color: '#f87171',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.info?.componentStack}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 2rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔄 Clear Storage & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
