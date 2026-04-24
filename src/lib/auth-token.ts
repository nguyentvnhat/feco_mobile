let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAccessToken(token: string) {
  const t = token.trim();
  accessToken = t || null;
}

export function setRefreshToken(token: string) {
  const t = token.trim();
  refreshToken = t || null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function clearAccessToken() {
  accessToken = null;
}

/** Clears access + refresh (use after logout). */
export function clearSession() {
  accessToken = null;
  refreshToken = null;
}
