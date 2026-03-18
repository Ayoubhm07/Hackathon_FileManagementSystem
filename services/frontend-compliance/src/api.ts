import axios from 'axios';
import keycloak, { getCurrentLocationHref } from './keycloak';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

api.interceptors.request.use(async (config) => {
  if (keycloak.token) {
    try {
      await keycloak.updateToken(30);
    } catch {
      keycloak.login({ redirectUri: getCurrentLocationHref() });
    }
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

export default api;
