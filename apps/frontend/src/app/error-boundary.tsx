import { Component, type ErrorInfo, type ReactNode } from 'react';

import { reportClientError } from '../shared/lib/client-error-reporter';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportClientError({
      severity: 'fatal',
      message: error.message || 'Unhandled React error',
      stack: error.stack,
      context: { componentStack: info.componentStack ?? undefined },
    });
  }

  private readonly handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Poppins, system-ui, sans-serif',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          Ocurrió un error inesperado.
        </h1>
        <p style={{ margin: 0, color: '#555', maxWidth: '32rem' }}>
          Ya registramos el problema. Probá recargar la página; si sigue
          pasando, avisanos.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: '#1f2937',
            color: 'white',
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
