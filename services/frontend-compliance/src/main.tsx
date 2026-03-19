import React, { StrictMode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import keycloak from './keycloak';
import App from './App';
import './index.css';

const CRM_URL = import.meta.env.VITE_CRM_URL ?? 'http://localhost:5173';

function Root() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required', pkceMethod: 'S256', checkLoginIframe: false })
      .then((authenticated) => {
        if (!authenticated) {
          keycloak.login();
          return;
        }
        // Redirect pure operators to the CRM frontend
        const roles: string[] = keycloak.tokenParsed?.realm_access?.roles ?? [];
        const isOperatorOnly =
          roles.includes('ROLE_OPERATOR') &&
          !roles.includes('ROLE_VALIDATOR') &&
          !roles.includes('ROLE_ADMIN');
        if (isOperatorOnly) {
          window.location.replace(CRM_URL);
          return;
        }
        setInitialized(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : JSON.stringify(err)));
  }, []);

  if (error) return <div className="p-8 text-red-600">Keycloak error: {error}</div>;
  if (!initialized)
    return <div className="flex h-screen items-center justify-center text-gray-500">Authentification en cours…</div>;

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
