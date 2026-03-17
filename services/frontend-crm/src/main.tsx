import React, { StrictMode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import keycloak from './keycloak';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Root() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required', pkceMethod: 'S256', checkLoginIframe: false })
      .then((authenticated) => {
        if (!authenticated) keycloak.login();
        setInitialized(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      });
  }, []);

  if (error) return <div className="p-8 text-red-600">Keycloak error: {error}</div>;
  if (!initialized) return <div className="flex h-screen items-center justify-center text-gray-500">Authentification en cours…</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
