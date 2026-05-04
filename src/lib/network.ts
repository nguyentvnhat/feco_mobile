import NetInfo, { NetInfoStateType, type NetInfoState } from '@react-native-community/netinfo';

export function isOffline(state: NetInfoState): boolean {
  if (state.isConnected === false) return true;
  if (state.isInternetReachable === false) return true;
  return false;
}

const defaultSnapshot: NetInfoState = {
  type: NetInfoStateType.unknown,
  isConnected: true,
  isInternetReachable: null,
  details: null,
};

let snapshot: NetInfoState = defaultSnapshot;
const storeListeners = new Set<() => void>();
const restoredListeners = new Set<() => void>();

function emitStore() {
  for (const l of storeListeners) {
    l();
  }
}

function emitRestored() {
  for (const l of restoredListeners) {
    try {
      l();
    } catch {
      /* ignore listener errors */
    }
  }
}

function applyState(next: NetInfoState) {
  const wasOffline = isOffline(snapshot);
  const nowOffline = isOffline(next);
  snapshot = next;
  emitStore();
  if (wasOffline && !nowOffline) {
    emitRestored();
  }
}

NetInfo.addEventListener(applyState);

void NetInfo.fetch().then(applyState);

export function subscribeNetwork(listener: () => void) {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

export function getNetworkSnapshot(): NetInfoState {
  return snapshot;
}

export function getIsOnline(): boolean {
  return !isOffline(snapshot);
}

/** Runs when connectivity goes from offline → online (not on cold start). */
export function onConnectionRestored(listener: () => void) {
  restoredListeners.add(listener);
  return () => {
    restoredListeners.delete(listener);
  };
}
