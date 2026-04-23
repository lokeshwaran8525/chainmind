import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

/**
 * React Error Boundary – catches render crashes and displays a styled
 * recovery screen instead of a white page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={containerStyle}>
          <div style={cardStyle}>
            {/* Glowing icon */}
            <div style={iconWrapperStyle}>
              <AlertOctagon size={48} style={{ color: '#ff2a2a', filter: 'drop-shadow(0 0 12px rgba(255, 42, 42, 0.6))' }} />
            </div>

            <h1 style={titleStyle}>SYSTEM FAULT DETECTED</h1>
            <p style={subtitleStyle}>
              A critical rendering error occurred in the ChainMind interface.
            </p>

            {/* Error details */}
            <div style={errorBoxStyle}>
              <span style={errorLabelStyle}>ERROR LOG</span>
              <code style={errorCodeStyle}>
                {this.state.error?.message || 'Unknown error'}
              </code>
              {this.state.errorInfo?.componentStack && (
                <pre style={stackStyle}>
                  {this.state.errorInfo.componentStack.slice(0, 300)}
                </pre>
              )}
            </div>

            {/* Action buttons */}
            <div style={buttonGroupStyle}>
              <button onClick={this.handleRetry} style={primaryButtonStyle}>
                <RotateCcw size={16} />
                RETRY MODULE
              </button>
              <button onClick={this.handleHome} style={secondaryButtonStyle}>
                <Home size={16} />
                RETURN TO BASE
              </button>
            </div>

            {/* Decorative scan line */}
            <div style={scanLineStyle} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ─── Inline styles (no CSS module needed, keeps it self-contained) ─────── */

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0a0f',
  backgroundImage:
    'radial-gradient(circle at 30% 20%, rgba(255, 42, 42, 0.06), transparent 50%), ' +
    'radial-gradient(circle at 70% 80%, rgba(176, 38, 255, 0.04), transparent 50%)',
  padding: '2rem',
};

const cardStyle = {
  maxWidth: '520px',
  width: '100%',
  background: 'rgba(20, 20, 30, 0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 42, 42, 0.25)',
  borderRadius: '12px',
  padding: '3rem 2.5rem',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 0 40px rgba(255, 42, 42, 0.08), 0 8px 32px rgba(0, 0, 0, 0.5)',
};

const iconWrapperStyle = {
  marginBottom: '1.5rem',
};

const titleStyle = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#ff2a2a',
  textShadow: '0 0 10px rgba(255, 42, 42, 0.4)',
  letterSpacing: '0.04em',
  marginBottom: '0.75rem',
};

const subtitleStyle = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.95rem',
  color: '#8a8a93',
  lineHeight: 1.5,
  marginBottom: '1.5rem',
};

const errorBoxStyle = {
  background: 'rgba(255, 42, 42, 0.06)',
  border: '1px solid rgba(255, 42, 42, 0.15)',
  borderRadius: '8px',
  padding: '1rem',
  textAlign: 'left',
  marginBottom: '2rem',
};

const errorLabelStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#ff2a2a',
  letterSpacing: '0.1em',
  display: 'block',
  marginBottom: '0.5rem',
};

const errorCodeStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  color: '#e0e0e0',
  wordBreak: 'break-word',
  lineHeight: 1.5,
};

const stackStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.7rem',
  color: '#8a8a93',
  marginTop: '0.75rem',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: '120px',
  overflow: 'auto',
  lineHeight: 1.4,
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const primaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(0, 240, 255, 0.1)',
  color: '#00f0ff',
  border: '1px solid rgba(0, 240, 255, 0.4)',
  padding: '0.65rem 1.25rem',
  borderRadius: '8px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.04em',
  transition: 'all 0.2s ease',
};

const secondaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'transparent',
  color: '#8a8a93',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '0.65rem 1.25rem',
  borderRadius: '8px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.04em',
  transition: 'all 0.2s ease',
};

const scanLineStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '2px',
  background: 'linear-gradient(90deg, transparent, rgba(255, 42, 42, 0.6), transparent)',
  animation: 'none',
};

export default ErrorBoundary;
