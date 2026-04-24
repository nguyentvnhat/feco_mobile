/**
 * Blocks API requests until the app has read SecureStore and mirrored tokens into memory.
 * Public routes (e.g. login) skip this gate.
 */

let hydrated = false;
const hydrationWaiters: (() => void)[] = [];

export function markSessionHydrated() {
  if (hydrated) return;
  hydrated = true;
  for (const resolve of hydrationWaiters) {
    resolve();
  }
  hydrationWaiters.length = 0;
}

export function isSessionHydrated() {
  return hydrated;
}

export function waitForSessionHydration(): Promise<void> {
  if (hydrated) return Promise.resolve();
  return new Promise((resolve) => {
    hydrationWaiters.push(resolve);
  });
}

function isPublicAuthPath(url: string | undefined) {
  if (!url) return false;
  return url.includes('/auth/login');
}

/** Use from Axios request interceptor: await before attaching auth headers. */
export async function ensureSessionReadyForRequest(url: string | undefined) {
  if (isPublicAuthPath(url)) return;
  await waitForSessionHydration();
}
