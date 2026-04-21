import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './app/error-boundary';
import { AuthSessionProvider } from './features/auth/hooks/use-auth-session';
import { reportClientError } from './shared/lib/client-error-reporter';

window.addEventListener('error', (event) => {
  reportClientError({
    severity: 'error',
    message: event.message || 'window.onerror',
    stack: event.error instanceof Error ? event.error.stack : undefined,
    context: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : 'Unhandled promise rejection';
  reportClientError({
    severity: 'error',
    message,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthSessionProvider>
          <AppRouter />
        </AuthSessionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
