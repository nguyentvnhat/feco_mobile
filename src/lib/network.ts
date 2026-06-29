import NetInfo, { NetInfoStateType, type NetInfoState } from '@react-native-community/netinfo';

export function isOffline(state: NetInfoState): boolean {
  // Chỉ tin isConnected. isInternetReachable hay false trên WiFi LAN/dev (không có internet công cộng)
  // và gây banner "mất mạng" dù WiFi vẫn dùng được API nội bộ.
  return state.isConnected === false;
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

export function isConnectivityErrorMessage(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  return (
    m === 'No internet connection' ||
    m === 'Không có kết nối mạng' ||
    m === 'Network request failed' ||
    m === 'Failed to fetch' ||
    m === 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.' ||
    m.includes('Không kết nối được máy chủ')
  );
}

/** Runs when connectivity goes from offline → online (not on cold start). */
export function onConnectionRestored(listener: () => void) {
  restoredListeners.add(listener);
  return () => {
    restoredListeners.delete(listener);
  };
}
