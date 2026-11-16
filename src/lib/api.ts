const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '';

/**
 * API origin for the separately hosted Express backend.
 * Keep this empty for same-origin local development.
 * Never put private API keys in VITE_* variables.
 */
const API_BASE_URL = configuredApiBase.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const hasExternalApi = API_BASE_URL.length > 0;
