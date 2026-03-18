import Keycloak from 'keycloak-js';

export function getCurrentLocationHref(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:5174/';
  }

  return window.location.href;
}

export function getCurrentLocationOrigin(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:5174';
  }

  return window.location.origin;
}

function getDefaultKeycloakUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }

  const { protocol, hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8080`;
  }

  const codespacesMatch = hostname.match(/^(.*)-\d+\.(app\.github\.dev)$/);
  if (codespacesMatch) {
    return `${protocol}//${codespacesMatch[1]}-8080.${codespacesMatch[2]}`;
  }

  return 'http://localhost:8080';
}

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? getDefaultKeycloakUrl(),
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'docflow',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'compliance-app',
});

export default keycloak;
