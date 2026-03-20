export const authTokenStorageKey = 'gentrix.auth.token';

export function readStoredAuthToken(): string | null {
  return window.localStorage.getItem(authTokenStorageKey);
}

export function persistAuthToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token);
    return;
  }

  window.localStorage.removeItem(authTokenStorageKey);
}
