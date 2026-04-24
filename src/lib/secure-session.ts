import * as SecureStore from 'expo-secure-store';

import { clearSession } from './auth-token';

const ACCESS_KEY = 'feco.auth.accessToken';
const REFRESH_KEY = 'feco.auth.refreshToken';

export async function readStoredSession(): Promise<{
  access: string | null;
  refresh: string | null;
}> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return {
    access: access?.trim() || null,
    refresh: refresh?.trim() || null,
  };
}

export async function writeStoredSession(access: string, refresh?: string | null) {
  const a = access.trim();
  await SecureStore.setItemAsync(ACCESS_KEY, a);
  if (refresh?.trim()) {
    await SecureStore.setItemAsync(REFRESH_KEY, refresh.trim());
  } else {
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined);
  }
}

export async function clearStoredSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined),
  ]);
}

/** Clears SecureStore and in-memory session tokens (used by logout + 401). */
export async function clearAllSession() {
  await clearStoredSession();
  clearSession();
}
