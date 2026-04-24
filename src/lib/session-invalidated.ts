type InvalidatedListener = () => void;

let listener: InvalidatedListener | null = null;

/** Called from API layer on 401; AuthProvider registers navigation + state reset. */
export function setSessionInvalidatedListener(cb: InvalidatedListener | null) {
  listener = cb;
}

export function notifySessionInvalidated() {
  listener?.();
}
