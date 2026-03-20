import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import { AppRouter } from './app/router';
import { AuthSessionProvider } from './features/auth/hooks/use-auth-session';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthSessionProvider>
        <AppRouter />
      </AuthSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
