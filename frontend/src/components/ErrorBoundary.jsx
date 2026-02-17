import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    margin: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    color: '#ef4444'
                }}>
                    <h3 style={{ marginBottom: '1rem' }}>Something went wrong.</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        There was an error rendering this component. Please try refreshing.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="arena-btn"
                        style={{ marginTop: '1.5rem', background: '#ef4444' }}
                    >
                        Refresh Page
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <pre style={{
                            marginTop: '1rem',
                            textAlign: 'left',
                            fontSize: '0.7rem',
                            overflowX: 'auto',
                            color: '#777'
                        }}>
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
